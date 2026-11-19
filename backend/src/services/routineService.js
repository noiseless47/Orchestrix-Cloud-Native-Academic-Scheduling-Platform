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
  async generateRoutine({ department, year, periodsPerDay = DEFAULT_PERIODS_PER_DAY, sectionsInput }) {
    let sections = sectionsInput;
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      const sectionsUrl = process.env.SECTIONS_URL || "http://sections:5103";
      const subjectsUrl = process.env.SUBJECTS_URL || "http://subjects:5101";
      const fromDb = await fetchJson(`${sectionsUrl}/api/sections?department=${encodeURIComponent(department)}&year=${year}`);
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

    const scheduled = generateTimetable({ department, year, periodsPerDay, sections });
    const meta = {
      periodsPerDay,
      days: DAYS,
      holidays: Object.fromEntries(sections.map((s) => [s.name, s.holidays || []]))
    };

    const routine = await Routine.findOneAndUpdate(
      { department, year },
      {
        department,
        year,
        periodsPerDay,
        sections: scheduled.sections,
        unsatisfied: scheduled.unsatisfied,
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

  async getRoutine({ department, year }) {
    const routine = await Routine.findOne({ department, year }).lean();
    if (!routine) {
      const err = new Error("Routine not found");
      err.status = 404;
      throw err;
    }
    return routine;
  }
};
