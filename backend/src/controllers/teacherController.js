import { asyncHandler } from "../middleware/asyncHandler.js";
import { teacherService } from "../services/teacherService.js";
import { ensureString, ensureArray, ensureNumber } from "../utils/validation.js";

export const createTeacher = asyncHandler(async (req, res) => {
  const name = ensureString(req.body.name, "name");
  const department = ensureString(req.body.department, "department");
  const email = req.body.email ? String(req.body.email) : undefined;
  const subjectIds = Array.isArray(req.body.subjectIds) ? req.body.subjectIds : undefined;
  const maxClassesPerDay = req.body.maxClassesPerDay == null ? undefined : ensureNumber(req.body.maxClassesPerDay, "maxClassesPerDay", { min: 1, max: 24 });
  const maxClassesPerWeek = req.body.maxClassesPerWeek == null ? undefined : ensureNumber(req.body.maxClassesPerWeek, "maxClassesPerWeek", { min: 1, max: 168 });
  const maxConsecutiveClasses = req.body.maxConsecutiveClasses == null ? undefined : ensureNumber(req.body.maxConsecutiveClasses, "maxConsecutiveClasses", { min: 1, max: 24 });
  const availability = Array.isArray(req.body.availability)
    ? req.body.availability.map((rule) => ({
        day: ensureString(rule.day, "availability.day"),
        periodsUnavailable: Array.isArray(rule.periodsUnavailable)
          ? rule.periodsUnavailable.map((period) => ensureNumber(period, "periodsUnavailable", { min: 0, max: 23 }))
          : [],
      }))
    : undefined;

  const teacher = await teacherService.createTeacher({
    name,
    department,
    email,
    subjectIds,
    maxClassesPerDay,
    maxClassesPerWeek,
    maxConsecutiveClasses,
    availability,
  });
  res.status(201).json(teacher);
});

export const listTeachers = asyncHandler(async (req, res) => {
  const { department } = req.query;
  const teachers = await teacherService.listTeachers(department);
  res.json(teachers);
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const id = ensureString(req.params.id, "id");
  const patch = {};
  if (req.body.name != null) patch.name = ensureString(req.body.name, "name");
  if (req.body.email != null) patch.email = String(req.body.email);
  if (req.body.department != null) patch.department = ensureString(req.body.department, "department");
  if (req.body.subjectIds != null) patch.subjects = ensureArray(req.body.subjectIds, "subjectIds");
  if (req.body.maxClassesPerDay != null) patch.maxClassesPerDay = ensureNumber(req.body.maxClassesPerDay, "maxClassesPerDay", { min: 1, max: 24 });
  if (req.body.maxClassesPerWeek != null) patch.maxClassesPerWeek = ensureNumber(req.body.maxClassesPerWeek, "maxClassesPerWeek", { min: 1, max: 168 });
  if (req.body.maxConsecutiveClasses != null) patch.maxConsecutiveClasses = ensureNumber(req.body.maxConsecutiveClasses, "maxConsecutiveClasses", { min: 1, max: 24 });
  if (req.body.availability != null) {
    patch.availability = Array.isArray(req.body.availability)
      ? req.body.availability.map((rule) => ({
          day: ensureString(rule.day, "availability.day"),
          periodsUnavailable: Array.isArray(rule.periodsUnavailable)
            ? rule.periodsUnavailable.map((period) => ensureNumber(period, "periodsUnavailable", { min: 0, max: 23 }))
            : [],
        }))
      : [];
  }

  const updated = await teacherService.updateTeacher(id, patch);
  if (!updated) {
    const err = new Error("Teacher not found");
    err.status = 404;
    throw err;
  }
  res.json(updated);
});

export const deleteTeacher = asyncHandler(async (req, res) => {
  const id = ensureString(req.params.id, "id");
  const deleted = await teacherService.deleteTeacher(id);
  if (!deleted) {
    const err = new Error("Teacher not found");
    err.status = 404;
    throw err;
  }
  res.json({ ok: true });
});
