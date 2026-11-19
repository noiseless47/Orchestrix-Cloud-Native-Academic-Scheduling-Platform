"use client";

import { useMemo, useRef, useState } from "react";
import WeeklyTable from "./WeeklyTable";
import { EmptyState } from "@/components/common/EmptyState";
import { Select } from "@/components/ui/Select";
import { DAYS } from "@/lib/helpers";
import { Button } from "@/components/ui/Button";
import { exportElementToPdf } from "@/lib/pdf";
import { useToast } from "@/hooks/useToast";
import { useTeachers } from "@/hooks/useTeachers";
import type { Routine, Teacher } from "@/lib/types";

export default function SectionTimetable({ routine }: { routine: Routine }) {
  const [selectedSection, setSelectedSection] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { list: teacherList } = useTeachers();
  const sections = routine.sections ?? [];
  const currentSection = sections.find((section) => section.name === selectedSection) ?? sections[0];
  const periodsPerDay = routine.periodsPerDay ?? 6;
  const teacherNames = useMemo(() => new Map<Teacher["_id"], string>(((teacherList.data ?? []) as Teacher[]).map((teacher) => [String(teacher._id), teacher.name])), [teacherList.data]);

  const tableData = useMemo(() => {
    if (!currentSection) return [];
    const holidaySet = new Set(currentSection.holidays ?? []);
    return DAYS.map((day) => holidaySet.has(day)
      ? Array.from({ length: periodsPerDay }, () => ({ subject: "Holiday", teacher: "" }))
      : Array.from({ length: periodsPerDay }, (_, periodIndex) => {
        const slot = currentSection.timetable?.[day]?.[periodIndex];
        return { subject: slot?.subjectName ?? slot?.subjectCode ?? "", teacher: slot?.teacherName ?? teacherNames.get(String(slot?.teacherId)) ?? "" };
      }));
  }, [currentSection, periodsPerDay, teacherNames]);

  const handleExport = async () => {
    if (!currentSection) return;
    setIsExporting(true);
    try {
      await exportElementToPdf(exportRef.current, {
        filename: `routine-${routine.department.toLowerCase()}-${routine.batchYear ?? "batch"}-${currentSection.name}.pdf`,
        title: `${routine.department} · Year ${routine.year} · Semester ${routine.semester ?? "-"} · Batch ${routine.batchYear ?? "-"} · Section ${currentSection.name}`,
        landscape: true,
      });
      toast("Schedule exported as PDF");
    } catch (error) {
      console.error(error);
      toast("Failed to export schedule", "error");
    } finally {
      setIsExporting(false);
    }
  };

  if (!sections.length) return <EmptyState title="No sections in this timetable" description="Generate a schedule with at least one configured section." />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Select label="Section" value={currentSection?.name ?? ""} onChange={(event) => setSelectedSection(event.target.value)}>
          {sections.map((section) => <option key={section.name} value={section.name}>Section {section.name}</option>)}
        </Select>
        <Button className="whitespace-nowrap" variant="secondary" onClick={handleExport} disabled={isExporting || !currentSection}>
          {isExporting ? "Preparing PDF…" : "Export PDF"}
        </Button>
      </div>
      <div ref={exportRef} className="space-y-4">
        <WeeklyTable data={tableData} periods={periodsPerDay} />
        {routine.quality && <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div className="timetable-metric"><div>Schedule quality</div><strong>{routine.quality.score ?? "—"}<span>/100</span></strong></div>
          <div className="timetable-metric"><div>Workload balance</div><strong>{routine.quality.balance?.score ?? "—"}<span>/100</span></strong></div>
          <div className="timetable-metric"><div>Teacher conflicts</div><strong>{routine.quality.conflictCount ?? 0}</strong></div>
          <div className="timetable-metric"><div>Unsatisfied classes</div><strong>{routine.quality.unsatisfiedClassCount ?? 0}</strong></div>
          <div className="timetable-workload xl:col-span-4">
            <div className="font-semibold text-gray-800">Teacher workload</div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{(routine.quality.teacherLoads ?? []).map((item) => <div key={item.teacherId} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"><span className="truncate text-gray-700">{teacherNames.get(String(item.teacherId)) ?? `Teacher ${String(item.teacherId).slice(-6)}`}</span><span className="shrink-0 font-semibold text-gray-900">{item.weeklyClasses}<span className="ml-1 text-xs font-normal text-gray-500">classes</span></span></div>)}</div>
            {routine.quality.algorithm && <div className="mt-2 text-xs text-gray-500">{routine.quality.algorithm}</div>}
          </div>
        </div>}
        {(routine.unsatisfied ?? []).length > 0 && <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Some subjects still need scheduling:
          <ul className="list-disc pl-5">{routine.unsatisfied?.map((item, index) => <li key={`${item.sectionName}-${item.subjectName ?? index}`}>{item.sectionName}: {item.subjectName ?? "Subject"} ({item.remaining} classes left)</li>)}</ul>
        </div>}
      </div>
    </div>
  );
}
