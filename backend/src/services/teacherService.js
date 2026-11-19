import { Teacher } from "../models/Teacher.js";
async function fetchSubjects() {
  const url = process.env.SUBJECTS_URL || "http://subjects:5101";
  const response = await fetch(`${url}/api/subjects`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) return [];
  return response.json();
}

export const teacherService = {
  async createTeacher({ name, department, email, subjectIds, ...constraints }) {
    return Teacher.create({ name, department, email, subjects: subjectIds, ...constraints });
  },

  async listTeachers(department) {
    const query = department ? { department } : {};
    const teachers = await Teacher.find(query).lean();
    const subjects = await fetchSubjects();
    const subjectMap = new Map(subjects.map((subject) => [String(subject._id), subject]));

    return teachers.map((teacher) => ({
      ...teacher,
      subjects: (teacher.subjects || [])
        .map((subjectId) => subjectMap.get(String(subjectId)))
        .filter(Boolean),
      assignedSubjects: [],
    }));
  },

  async updateTeacher(id, patch) {
    return Teacher.findByIdAndUpdate(id, patch, { new: true });
  },

  async deleteTeacher(id) {
    return Teacher.findByIdAndDelete(id);
  },
};
