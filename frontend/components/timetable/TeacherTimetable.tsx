"use client";

import { useMemo, useState } from "react";
import WeeklyTable from "./WeeklyTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Select } from "@/components/ui/Select";
import { DAYS } from "@/lib/helpers";
import { useTeachers } from "@/hooks/useTeachers";
import type { Routine, Teacher } from "@/lib/types";

type TeacherOption = { teacherId: string; teacherName: string };

export default function TeacherTimetable({ routine }: { routine: Routine }) {
  const { list: teacherList } = useTeachers();
  const [teacherId, setTeacherId] = useState("");
  const sections = routine.sections ?? [];
  const periodsPerDay = routine.periodsPerDay ?? 6;

  const teacherOptions = useMemo<TeacherOption[]>(() => {
    const options = new Map<string, string>();
    const teachersFromApi: Teacher[] = teacherList.data ?? [];
    for (const section of sections) {
      for (const day of DAYS) {
        for (const slot of section.timetable?.[day] ?? []) {
          if (!slot?.teacherId) continue;
          const fallback = teachersFromApi.find((teacher) => String(teacher._id) === String(slot.teacherId));
          options.set(String(slot.teacherId), slot.teacherName ?? fallback?.name ?? String(slot.teacherId));
        }
      }
    }
    return [...options].map(([id, name]) => ({ teacherId: id, teacherName: name })).sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  }, [sections, teacherList.data]);

  const activeTeacherId = teacherOptions.find((teacher) => teacher.teacherId === teacherId)?.teacherId ?? teacherOptions[0]?.teacherId ?? "";
  const tableData = useMemo(() => {
    if (!activeTeacherId) return [];
    return DAYS.map((day) => Array.from({ length: periodsPerDay }, (_, periodIndex) => {
      const slot = sections.map((section) => {
        const item = section.timetable?.[day]?.[periodIndex];
        return item ? { ...item, sectionName: section.name } : null;
      }).find((item) => item?.teacherId === activeTeacherId);
      return {
        subject: slot ? `${slot.subjectName ?? slot.subjectCode ?? "Class"} (Section ${slot.sectionName})` : "-",
        teacher: slot?.teacherName ?? slot?.teacherId ?? "",
      };
    }));
  }, [activeTeacherId, periodsPerDay, sections]);

  if (!sections.length) return <EmptyState title="No sections in this timetable" description="Generate a schedule with at least one configured section." />;
  if (!teacherOptions.length) return <EmptyState title="No teacher assignments" description="This batch timetable has no scheduled teacher assignments." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Select label="Teacher" value={activeTeacherId} onChange={(event) => setTeacherId(event.target.value)}>
          {teacherOptions.map((teacher) => <option key={teacher.teacherId} value={teacher.teacherId}>{teacher.teacherName}</option>)}
        </Select>
        <p className="text-sm text-gray-600">{routine.department} · Year {routine.year} · Semester {routine.semester ?? "—"} · Batch {routine.batchYear ?? "—"}</p>
      </div>
      <WeeklyTable data={tableData} periods={periodsPerDay} />
    </div>
  );
}
