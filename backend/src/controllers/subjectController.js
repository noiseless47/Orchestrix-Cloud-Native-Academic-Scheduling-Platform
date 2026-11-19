import { asyncHandler } from "../middleware/asyncHandler.js";
import { subjectService } from "../services/subjectService.js";
import { ensureString } from "../utils/validation.js";

export const createSubject = asyncHandler(async (req, res) => {
  const subjectName = ensureString(req.body.subjectName, "subjectName");
  const subjectCode = ensureString(req.body.subjectCode, "subjectCode");
  const department = ensureString(req.body.department, "department");
  const defaultClassesPerWeek = req.body.defaultClassesPerWeek != null ? Number(req.body.defaultClassesPerWeek) : undefined;
  const semester = req.body.semester != null ? Number(req.body.semester) : undefined;
  const electiveGroup = req.body.electiveGroup != null ? String(req.body.electiveGroup) : undefined;
  const subject = await subjectService.createSubject({ subjectName, subjectCode, department, defaultClassesPerWeek, semester, electiveGroup });
  res.status(201).json(subject);
});

export const listSubjects = asyncHandler(async (req, res) => {
  const { department, semester, year } = req.query;
  const subjects = await subjectService.listSubjects({
    department,
    semester: semester != null ? Number(semester) : undefined,
    year: year != null ? Number(year) : undefined,
  });
  res.json(subjects);
});
