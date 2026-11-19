import { asyncHandler } from "../middleware/asyncHandler.js";
import { routineService } from "../services/routineService.js";
import { ensureString, ensureNumber } from "../utils/validation.js";
import { Routine } from "../models/Routine.js";

export const generateRoutine = asyncHandler(async (req, res) => {
  const department = ensureString(req.body.department, "department");
  const year = ensureNumber(req.body.year, "year", { min: 1, max: 4 });
  const semester = req.body.semester != null
    ? ensureNumber(req.body.semester, "semester", { min: 1, max: 8 })
    : undefined;
  const batchYear = req.body.batchYear != null
    ? ensureNumber(req.body.batchYear, "batchYear", { min: 2026, max: 2100 })
    : undefined;
  const periodsPerDay = req.body.periodsPerDay ? ensureNumber(req.body.periodsPerDay, "periodsPerDay", { min: 1 }) : undefined;
  const constraintsBody = req.body.constraints && typeof req.body.constraints === "object"
    ? req.body.constraints
    : {};
  const constraints = {};
  for (const field of ["periodsPerDayMaxTeacher", "maxClassesPerDay", "maxClassesPerWeek", "maxConsecutiveClasses"]) {
    if (constraintsBody[field] != null) {
      constraints[field] = ensureNumber(constraintsBody[field], `constraints.${field}`, { min: 1, max: 168 });
    }
  }
  if (constraintsBody.requireSubjectSpread != null) constraints.requireSubjectSpread = Boolean(constraintsBody.requireSubjectSpread);
  if (constraintsBody.requireTeacherBalance != null) constraints.requireTeacherBalance = Boolean(constraintsBody.requireTeacherBalance);
  if (constraintsBody.softWeights && typeof constraintsBody.softWeights === "object") {
    constraints.softWeights = {};
    for (const [key, value] of Object.entries(constraintsBody.softWeights)) {
      if (["subjectSpread", "teacherBalance", "avoidEdgePeriods", "avoidTeacherGaps", "avoidSameSubjectAdjacentDays"].includes(key)) {
        constraints.softWeights[key] = ensureNumber(value, `constraints.softWeights.${key}`, { min: 0, max: 100 });
      }
    }
  }

  const sectionsInput = Array.isArray(req.body.sections)
    ? req.body.sections
        .map((s, idx) => {
          const sectionNameCandidate = typeof (s.name ?? s.sectionName) === "string" ? (s.name ?? s.sectionName).trim() : "";
          const sectionName = sectionNameCandidate.length > 0 ? sectionNameCandidate : String.fromCharCode(65 + idx);

          const subjects = (s.subjects || [])
            .map((sub) => {
              const subjectIdRaw = sub.subjectId ?? sub.id ?? sub._id;
              const teacherIdRaw = sub.teacherId ?? sub.assignedTeacher ?? sub.teacher?._id;
              const weeklyRaw = sub.classesPerWeek ?? sub.weekly;

              if (!subjectIdRaw || !teacherIdRaw || weeklyRaw == null) {
                return null;
              }

              const classesPerWeek = ensureNumber(weeklyRaw, "classesPerWeek", { min: 0 });
              if (classesPerWeek === 0) return null;

              const subjectName = typeof sub.subjectName === "string" ? sub.subjectName.trim() : sub.name?.trim();
              const subjectCode = typeof sub.subjectCode === "string" ? sub.subjectCode.trim() : sub.code?.trim();
              const teacherName = typeof sub.teacherName === "string" ? sub.teacherName.trim() : sub.teacher?.name?.trim();

              return {
                subjectId: ensureString(subjectIdRaw, "subjectId"),
                subjectName,
                subjectCode,
                teacherId: ensureString(teacherIdRaw, "teacherId"),
                teacherName,
                classesPerWeek,
              };
            })
            .filter(Boolean);

          return {
            sectionId: s.sectionId ? String(s.sectionId) : undefined,
            name: sectionName,
            holidays: Array.isArray(s.holidays) ? s.holidays : undefined,
            subjects,
          };
        })
        .filter((sec) => sec.subjects.length > 0)
    : undefined;

  if (!sectionsInput || sectionsInput.length === 0) {
    const err = new Error("At least one section with subjects is required");
    err.status = 400;
    throw err;
  }

  const routine = await routineService.generateRoutine({
    department,
    year,
    semester,
    batchYear,
    periodsPerDay,
    sectionsInput,
    constraints,
  });
  res.status(201).json(routine);
});

export const getSchedule = asyncHandler(async (req, res) => {
  const { department, year, semester, batchYear } = req.query;

  // The timetable view needs every generated cohort; unfiltered legacy requests still return the latest routine.
  if (req.query.all === "true") {
    const routines = await Routine.find({}).sort({ updatedAt: -1 }).lean();
    return res.json(routines);
  }

  if (department && year) {
    const dep = ensureString(department, "department");
    const yr = ensureNumber(year, "year", { min: 1, max: 4 });
    try {
      const sem = semester != null ? ensureNumber(semester, "semester", { min: 1, max: 8 }) : undefined;
      const batch = batchYear != null ? ensureNumber(batchYear, "batchYear", { min: 2026, max: 2100 }) : undefined;
      const routine = await routineService.getRoutine({ department: dep, year: yr, semester: sem, batchYear: batch });
      return res.json(routine);
    } catch (e) {
      return res.status(200).json({ department: dep, year: yr, sections: [], meta: { message: "No routine yet" } });
    }
  }

  const latest = await Routine.findOne({}).sort({ updatedAt: -1 }).lean();
  if (!latest) {
    return res.status(200).json({ sections: [], meta: { message: "No schedules found" } });
  }
  return res.json(latest);
});

export const updateRoutineSlot = asyncHandler(async (req, res) => {
  const id = ensureString(req.params.id, "id");
  const sectionName = ensureString(req.body.sectionName, "sectionName");
  const fromDay = ensureString(req.body.fromDay, "fromDay");
  const fromPeriod = ensureNumber(req.body.fromPeriod, "fromPeriod", { min: 0 });
  const toDay = ensureString(req.body.toDay, "toDay");
  const toPeriod = ensureNumber(req.body.toPeriod, "toPeriod", { min: 0 });
  const routine = await routineService.moveRoutineSlot({
    id,
    sectionName,
    fromDay,
    fromPeriod,
    toDay,
    toPeriod,
  });
  res.json(routine);
});

export const swapRoutineSlots = asyncHandler(async (req, res) => {
  const id = ensureString(req.params.id, "id");
  if (!req.body.first || !req.body.second) {
    const err = new Error("first and second swap locations are required");
    err.status = 400;
    throw err;
  }
  const first = {
    sectionName: ensureString(req.body.first.sectionName, "first.sectionName"),
    day: ensureString(req.body.first.day, "first.day"),
    period: ensureNumber(req.body.first.period, "first.period", { min: 0 }),
  };
  const second = {
    sectionName: ensureString(req.body.second.sectionName, "second.sectionName"),
    day: ensureString(req.body.second.day, "second.day"),
    period: ensureNumber(req.body.second.period, "second.period", { min: 0 }),
  };
  const routine = await routineService.swapRoutineSlots({ id, first, second });
  res.json(routine);
});
