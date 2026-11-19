export interface Subject {
  _id: string;
  subjectName: string;
  subjectCode: string;
  department: string;
  semester?: number;
  electiveGroup?: string;
}

export interface Teacher {
  _id: string;
  name: string;
  email?: string;
  department: string;
  subjects: Subject[]; // Teachable subjects
  assignedSubjects: Subject[];
}

export interface Section {
  _id: string;
  name: string;
  department: string;
  year: number;
  semester: number;
  batchYear: number;
  subjects: { subjectId: string; teacherId: string; classesPerWeek: number }[];
  holidays?: string[];
}

export interface RoutineSlot {
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  teacherId: string;
  teacherName?: string;
  day: string;
  period: number;
}

export interface RoutineSection {
  name: string;
  holidays?: string[];
  timetable: Record<string, (RoutineSlot | null)[]>;
}

export interface Routine {
  _id: string;
  department: string;
  year: number;
  semester?: number;
  batchYear?: number;
  periodsPerDay: number;
  sections: RoutineSection[];
  unsatisfied?: { sectionName: string; subjectName?: string; remaining: number }[];
  quality?: {
    score?: number;
    balance?: { score?: number };
    conflictCount?: number;
    unsatisfiedClassCount?: number;
    teacherLoads?: { teacherId: string; weeklyClasses: number }[];
    algorithm?: string;
  };
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    picture: string;
  };
}
