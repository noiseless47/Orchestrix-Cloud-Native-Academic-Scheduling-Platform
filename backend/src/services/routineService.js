import { DEFAULT_PERIODS_PER_DAY } from "../utils/constants.js";
import { generateTimetable } from "../utils/scheduler.js";
import { Routine } from "../models/Routine.js";
import { TeacherAssignmentHistory } from "../models/TeacherAssignmentHistory.js";
import { DAYS } from "../utils/constants.js";

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Request failed: ${response.status} ${url}`);
  return response.json();
}

export const routineService = {
  async generateRoutine({ department, year, semester, batchYear, periodsPerDay = DEFAULT_PERIODS_PER_DAY, sectionsInput, constraints = {} }) {
    let sections = sectionsInput;
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      const sectionsUrl = process.env.SECTIONS_URL || "http://sections:5103";
      const subjectsUrl = process.env.SUBJECTS_URL || "http://subjects:5101";
      const fromDb = await fetchJson(`${sectionsUrl}/api/sections?department=${encodeURIComponent(department)}&year=${year}${semester ? `&semester=${semester}` : ""}${batchYear ? `&batchYear=${batchYear}` : ""}`);
      const subjects = await fetchJson(`${subjectsUrl}/api/subjects?department=${encodeURIComponent(department)}`);
      const subjMap = new Map(subjects.map((s) => [String(s._id), s]));
      sections = fromDb.map((s) => ({
        name: s.name,
        holidays: s.holidays || [],
        subjects: s.subjects.map((sub) => ({
          subjectId: String(sub.subjectId),
          subjectName: subjMap.get(String(sub.subjectId))?.subjectName,
          subjectCode: subjMap.get(String(sub.subjectId))?.subjectCode,
          classesPerWeek: sub.classesPerWeek,
          teacherId: String(sub.teacherId),
        })),
      }));
    }

    // Ensure subject details present if input provided
    const missingSubjectIds = [];
    sections.forEach((sec) => {
      sec.subjects.forEach((s) => {
        if (!s.subjectName || !s.subjectCode) missingSubjectIds.push(s.subjectId);
      });
    });
    if (missingSubjectIds.length) {
      const uniq = [...new Set(missingSubjectIds)];
      const subjectsUrl = process.env.SUBJECTS_URL || "http://subjects:5101";
      const subjects = await fetchJson(`${subjectsUrl}/api/subjects`);
      const subjMap = new Map(subjects.map((s) => [String(s._id), s]));
      sections.forEach((sec) => {
        sec.subjects.forEach((s) => {
          if (!s.subjectName || !s.subjectCode) {
            const sub = subjMap.get(String(s.subjectId));
            if (sub) {
              s.subjectName = sub.subjectName;
              s.subjectCode = sub.subjectCode;
            }
          }
        });
      });
    }

    const teacherIds = [...new Set(sections.flatMap((section) =>
      section.subjects.map((subject) => String(subject.teacherId)),
    ))];
    const teacherProfiles = {};
    if (teacherIds.length) {
      const teachersUrl = process.env.TEACHERS_URL || "http://teachers:5102";
      try {
        const teachers = await fetchJson(`${teachersUrl}/api/teachers?department=${encodeURIComponent(department)}`);
        for (const teacher of teachers) {
          if (teacherIds.includes(String(teacher._id))) {
            teacherProfiles[String(teacher._id)] = {
              name: teacher.name,
              availability: teacher.availability,
              maxClassesPerDay: teacher.maxClassesPerDay,
              maxClassesPerWeek: teacher.maxClassesPerWeek,
              maxConsecutiveClasses: teacher.maxConsecutiveClasses,
            };
          }
        }
      } catch (_) {
        // Generation remains available when optional teacher profile data is unavailable.
      }
    }

    const scheduled = generateTimetable({
      department,
      year,
      semester,
      batchYear,
      periodsPerDay,
      sections,
      constraints,
      teacherProfiles,
    });
    const meta = {
      periodsPerDay,
      days: DAYS,
      semester,
      batchYear,
      holidays: Object.fromEntries(sections.map((s) => [s.name, s.holidays || []]))
    };

    const routine = await Routine.findOneAndUpdate(
      { department, year, ...(semester != null ? { semester } : {}), ...(batchYear != null ? { batchYear } : {}) },
      {
        department,
        year,
        ...(semester != null ? { semester } : {}),
        ...(batchYear != null ? { batchYear } : {}),
        periodsPerDay,
        sections: scheduled.sections,
        unsatisfied: scheduled.unsatisfied,
        constraints,
        quality: scheduled.quality,
        meta,
      },
      { new: true, upsert: true }
    );

    // Persist teacher assignment history (best-effort)
    try {
      const docs = [];
      for (const sec of scheduled.sections) {
        for (const day of DAYS) {
          const arr = sec.timetable[day] || [];
          arr.forEach((slot, periodIndex) => {
            if (slot && slot.teacherId) {
              docs.push({
                teacherId: slot.teacherId,
                date: new Date(),
                day,
                periodIndex,
                sectionName: sec.name,
                routineId: routine._id,
              });
            }
          });
        }
      }
      if (docs.length) await TeacherAssignmentHistory.insertMany(docs);
    } catch (_) {
      // ignore history errors
    }

    return routine;
  },

  async getRoutine({ department, year, semester, batchYear }) {
    const filter = { department, year };
    if (semester != null) filter.semester = semester;
    if (batchYear != null) filter.batchYear = batchYear;
    const routine = await Routine.findOne(filter).lean();
    if (!routine) {
      const err = new Error("Routine not found");
      err.status = 404;
      throw err;
    }
    return routine;
  },

  async getRoutineById(id) {
    const routine = await Routine.findById(id);
    if (!routine) {
      const err = new Error("Routine not found");
      err.status = 404;
      throw err;
    }
    return routine;
  },

  async fetchTeacherProfiles(department) {
    try {
      const teachersUrl = process.env.TEACHERS_URL || "http://teachers:5102";
      const teachers = await fetchJson(`${teachersUrl}/api/teachers?department=${encodeURIComponent(department)}`);
      return Object.fromEntries(teachers.map((teacher) => [
        String(teacher._id),
        {
          name: teacher.name,
          availability: teacher.availability,
          maxClassesPerDay: teacher.maxClassesPerDay,
          maxClassesPerWeek: teacher.maxClassesPerWeek,
          maxConsecutiveClasses: teacher.maxConsecutiveClasses,
        },
      ]));
    } catch (_) {
      return {};
    }
  },

  async moveRoutineSlot({ id, sectionName, fromDay, fromPeriod, toDay, toPeriod }) {
    const routine = await this.getRoutineById(id);
    const section = routine.sections.find((item) => item.name === sectionName);
    if (!section) {
      const err = new Error("Section not found");
      err.status = 404;
      throw err;
    }

    const timetable = section.timetable;
    const source = timetable[fromDay]?.[fromPeriod];
    if (!source) {
      const err = new Error("No class exists in the source slot");
      err.status = 400;
      throw err;
    }
    if (fromDay === toDay && fromPeriod === toPeriod) return routine;
    if (!DAYS.includes(toDay) || toPeriod < 0 || toPeriod >= routine.periodsPerDay) {
      const err = new Error("Target slot is outside the timetable");
      err.status = 400;
      throw err;
    }

    const holidays = routine.meta?.holidays?.[sectionName] || [];
    if (holidays.includes(toDay)) {
      const err = new Error("Target day is a section holiday");
      err.status = 409;
      throw err;
    }
    if (timetable[toDay]?.[toPeriod]) {
      const err = new Error("Target slot is occupied. Use the swap operation instead.");
      err.status = 409;
      throw err;
    }

    const profiles = await this.fetchTeacherProfiles(routine.department);
    const profile = profiles[String(source.teacherId)];
    if (profile?.availability) {
      const unavailable = profile.availability.find?.((rule) => rule.day === toDay)?.periodsUnavailable || [];
      if (unavailable.includes(toPeriod)) {
        const err = new Error("Teacher is unavailable during the target slot");
        err.status = 409;
        throw err;
      }
    }

    for (const otherSection of routine.sections) {
      if (otherSection.name === sectionName) continue;
      const collision = otherSection.timetable[toDay]?.[toPeriod];
      if (collision && String(collision.teacherId) === String(source.teacherId)) {
        const err = new Error("Teacher already teaches another section in the target slot");
        err.status = 409;
        throw err;
      }
    }

    timetable[fromDay][fromPeriod] = null;
    timetable[toDay][toPeriod] = { ...source, day: toDay, period: toPeriod };
    routine.markModified("sections");
    return routine.save();
  },

  async swapRoutineSlots({ id, first, second }) {
    const routine = await this.getRoutineById(id);
    const firstSection = routine.sections.find((item) => item.name === first.sectionName);
    const secondSection = routine.sections.find((item) => item.name === second.sectionName);
    if (!firstSection || !secondSection) {
      const err = new Error("A section was not found");
      err.status = 404;
      throw err;
    }
    const firstSlot = firstSection.timetable[first.day]?.[first.period];
    const secondSlot = secondSection.timetable[second.day]?.[second.period];
    if (!firstSlot || !secondSlot) {
      const err = new Error("Both swap slots must contain a class");
      err.status = 400;
      throw err;
    }

    const profiles = await this.fetchTeacherProfiles(routine.department);
    const holidayBySection = routine.meta?.holidays || {};
    const validTargets = [
      { section: firstSection, slot: secondSlot, day: first.day, period: first.period },
      { section: secondSection, slot: firstSlot, day: second.day, period: second.period },
    ];
    for (const target of validTargets) {
      if (holidayBySection[target.section.name]?.includes(target.day)) {
        const err = new Error("The swap would place a class on a section holiday");
        err.status = 409;
        throw err;
      }
      const profile = profiles[String(target.slot.teacherId)];
      const unavailable = profile?.availability?.find?.((rule) => rule.day === target.day)?.periodsUnavailable || [];
      if (unavailable.includes(target.period)) {
        const err = new Error("The swap would place a class during a teacher's unavailable period");
        err.status = 409;
        throw err;
      }
    }

    for (const target of validTargets) {
      for (const section of routine.sections) {
        if (section.name === target.section.name) continue;
        const collision = section.timetable[target.day]?.[target.period];
        if (collision && String(collision.teacherId) === String(target.slot.teacherId)) {
          const err = new Error("The swap would create a teacher collision");
          err.status = 409;
          throw err;
        }
      }
    }

    firstSection.timetable[first.day][first.period] = { ...secondSlot, day: first.day, period: first.period };
    secondSection.timetable[second.day][second.period] = { ...firstSlot, day: second.day, period: second.period };
    routine.markModified("sections");
    return routine.save();
  }
};
