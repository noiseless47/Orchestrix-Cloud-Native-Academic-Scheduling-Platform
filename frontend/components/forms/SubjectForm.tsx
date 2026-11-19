"use client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";

export default function SubjectForm({ onSubmit, isPending = false }: { onSubmit: (data: any) => void; isPending?: boolean }) {
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [department, setDepartment] = useState("ISE");
  const [semester, setSemester] = useState("");
  const [electiveGroup, setElectiveGroup] = useState("");

  return (
    <form
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit({
          subjectName,
          subjectCode,
          department,
          semester: semester ? Number(semester) : undefined,
          electiveGroup: electiveGroup || undefined,
        });
      }}
      className="space-y-4"
    >
      <Input label="Subject Name" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} required />
      <Input label="Subject Code" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} required />
      <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} required />
      <Input label="Semester" type="number" min={1} max={8} value={semester} onChange={(e) => setSemester(e.target.value)} />
      <Input label="Elective group" value={electiveGroup} onChange={(e) => setElectiveGroup(e.target.value)} placeholder="Example: B, C, D, or E" />
      <Button type="submit" variant="primary" disabled={isPending}>{isPending ? "Saving…" : "Save subject"}</Button>
    </form>
  );
}
