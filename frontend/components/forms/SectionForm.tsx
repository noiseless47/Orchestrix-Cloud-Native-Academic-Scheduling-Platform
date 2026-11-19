"use client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

export default function SectionForm({ onSubmit, isPending = false }: { onSubmit: (data: any) => void; isPending?: boolean }) {
  const [department, setDepartment] = useState("ISE");
  const [sectionName, setSectionName] = useState("");
  const [year, setYear] = useState("4");
  const [semester, setSemester] = useState("7");
  const [batchYear, setBatchYear] = useState("2027");

  return (
    <form
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit({ department, sectionName, year: Number(year), semester: Number(semester), batchYear: Number(batchYear) });
      }}
      className="space-y-4"
    >
      <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} required />
      <Input label="Section name" value={sectionName} onChange={(e) => setSectionName(e.target.value)} required />
      <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
      <Input label="Semester" type="number" min={1} max={8} value={semester} onChange={(e) => setSemester(e.target.value)} required />
      <Input label="Graduation batch year" type="number" min={2026} value={batchYear} onChange={(e) => setBatchYear(e.target.value)} required />
      <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save section"}</Button>
    </form>
  );
}
