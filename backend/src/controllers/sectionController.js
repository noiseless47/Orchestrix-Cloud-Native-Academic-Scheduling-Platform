import { asyncHandler } from "../middleware/asyncHandler.js";
import { sectionService } from "../services/sectionService.js";
import { ensureString, ensureNumber, ensureArray } from "../utils/validation.js";

export const createSections = asyncHandler(async (req, res) => {
  const department = ensureString(req.body.department, "department");
  const year = ensureNumber(req.body.year, "year", { min: 1, max: 4 });
  const semester = req.body.semester != null
    ? ensureNumber(req.body.semester, "semester", { min: 1, max: 8 })
    : undefined;
  const batchYear = req.body.batchYear != null
    ? ensureNumber(req.body.batchYear, "batchYear", { min: 2026, max: 2100 })
    : undefined;
  const names = req.body.sections
    ? ensureArray(req.body.sections, "sections").map((n) => ensureString(n, "sections[]"))
    : [ensureString(req.body.name ?? req.body.sectionName, "name")];

  const created = await sectionService.createSections({ department, year, semester, batchYear, names });
  res.status(201).json(created);
});

export const addSubjects = asyncHandler(async (req, res) => {
  const sectionId = ensureString(req.params.id ?? req.body.sectionId, "sectionId");
  const subjects = ensureArray(req.body.subjects, "subjects").map((s) => ({
    subjectId: ensureString(s.subjectId, "subjectId"),
    classesPerWeek: ensureNumber(s.classesPerWeek, "classesPerWeek", { min: 0 }),
    teacherId: ensureString(s.teacherId, "teacherId"),
  }));
  const holidays = req.body.holidays ? ensureArray(req.body.holidays, "holidays") : undefined;

  const updated = await sectionService.setSubjectsAndHolidays({ sectionId, subjects, holidays });
  res.json(updated);
});

export const listSections = asyncHandler(async (req, res) => {
  const { department, year, semester, batchYear } = req.query;
  // Optional filters: validate only if provided
  const dep = department != null && department !== "" ? ensureString(department, "department") : undefined;
  const yr = year != null && year !== "" ? ensureNumber(year, "year", { min: 1, max: 4 }) : undefined;
  const sem = semester != null && semester !== "" ? ensureNumber(semester, "semester", { min: 1, max: 8 }) : undefined;
  const batch = batchYear != null && batchYear !== "" ? ensureNumber(batchYear, "batchYear", { min: 2026, max: 2100 }) : undefined;
  const sections = await sectionService.listByDepartmentYear({ department: dep, year: yr, semester: sem, batchYear: batch });
  res.json(sections);
});
