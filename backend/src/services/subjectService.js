import { Subject } from "../models/Subject.js";

export const subjectService = {
  async createSubject({ subjectName, subjectCode, department, defaultClassesPerWeek, semester, electiveGroup }) {
    const payload = { subjectName, subjectCode, department };
    if (defaultClassesPerWeek != null) payload.defaultClassesPerWeek = Number(defaultClassesPerWeek);
    if (semester != null) payload.semester = Number(semester);
    if (electiveGroup != null) payload.electiveGroup = electiveGroup;
    const doc = await Subject.create(payload);
    return doc;
  },

  async listSubjects(filters = {}) {
    const department = typeof filters === "string" ? filters : filters.department;
    const semester = typeof filters === "object" ? filters.semester : undefined;
    const year = typeof filters === "object" ? filters.year : undefined;
    const filter = {};
    if (department) filter.department = department;
    if (semester != null) filter.semester = semester;
    if (year != null) {
      filter.semester = {
        $gte: (Number(year) - 1) * 2 + 1,
        $lte: Number(year) * 2,
      };
    }
    return Subject.find(filter).lean();
  },
};
