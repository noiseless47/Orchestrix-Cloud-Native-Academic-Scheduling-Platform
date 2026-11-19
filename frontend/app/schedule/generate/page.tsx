"use client";
import RoutineWizard from "@/components/forms/RoutineWizard";
import { PageHeader } from "@/components/common/PageHeader";

export default function GenerateSchedulePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Generate Schedule" description="Build a conflict-aware timetable from your configured sections and teaching assignments." />
      <RoutineWizard />
    </div>
  );
}
