"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SectionTimetable from "@/components/timetable/SectionTimetable";
import TeacherTimetable from "@/components/timetable/TeacherTimetable";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/common/EmptyState";
import { Loader } from "@/components/ui/Loader";
import { PageHeader } from "@/components/common/PageHeader";
import { getSchedules } from "@/lib/api";
import type { Routine } from "@/lib/types";

export default function ViewSchedulePage() {
  const [tab, setTab] = useState<"section" | "teacher">("section");
  const [routineId, setRoutineId] = useState("");
  const routinesQuery = useQuery<Routine[]>({ queryKey: ["schedules", "all"], queryFn: getSchedules });
  const routines = routinesQuery.data ?? [];
  const routine = routines.find((item) => item._id === routineId) ?? routines[0];

  return (
    <div className="space-y-5">
      <PageHeader title="Timetable" description="View generated schedules by department, year, semester, and batch." />
      {routinesQuery.isLoading ? <Loader /> : routinesQuery.isError ? (
        <EmptyState title="Failed to load timetables" description={routinesQuery.error instanceof Error ? routinesQuery.error.message : "Please try again."}>
          <Button variant="secondary" onClick={() => routinesQuery.refetch()}>Retry</Button>
        </EmptyState>
      ) : !routine ? (
        <EmptyState title="No timetable available" description="Generate a schedule to view it here." />
      ) : (
        <>
          <div className="grid grid-cols-1 items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_auto]">
            <Select label="Department, year, semester, and batch" value={routine._id} onChange={(event) => setRoutineId(event.target.value)}>
              {routines.map((item) => <option key={item._id} value={item._id}>
                {item.department} · Year {item.year} · Semester {item.semester ?? "—"} · Batch {item.batchYear ?? "—"}
              </option>)}
            </Select>
            <div className="flex flex-nowrap gap-2" role="group" aria-label="Timetable view">
              <Button className="min-w-[120px] whitespace-nowrap" variant={tab === "section" ? "primary" : "secondary"} aria-pressed={tab === "section"} onClick={() => setTab("section")}>Section view</Button>
              <Button className="min-w-[120px] whitespace-nowrap" variant={tab === "teacher" ? "primary" : "secondary"} aria-pressed={tab === "teacher"} onClick={() => setTab("teacher")}>Teacher view</Button>
            </div>
          </div>
          {tab === "section" ? <SectionTimetable routine={routine} /> : <TeacherTimetable routine={routine} />}
        </>
      )}
    </div>
  );
}
