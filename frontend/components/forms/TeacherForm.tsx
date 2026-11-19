"use client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useSubjects } from "@/hooks/useSubjects";
import { useState } from "react";

export default function TeacherForm({ onSubmit, isPending = false }: { onSubmit: (data: any) => void; isPending?: boolean }) {
  const { list } = useSubjects();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("ISE");
  const [subjectId, setSubjectId] = useState<string>("");
  const [maxClassesPerDay, setMaxClassesPerDay] = useState("4");
  const [maxClassesPerWeek, setMaxClassesPerWeek] = useState("18");
  const [maxConsecutiveClasses, setMaxConsecutiveClasses] = useState("2");
  const [unavailablePeriods, setUnavailablePeriods] = useState<Record<string, string>>({});
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <form
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const availability = days
          .filter((day) => unavailablePeriods[day]?.trim())
          .map((day) => ({
            day,
            periodsUnavailable: unavailablePeriods[day]
              .split(",")
              .map((value) => Number(value.trim()))
              .filter((value) => Number.isInteger(value) && value >= 0),
          }));
        onSubmit({
          name,
          email: email || undefined,
          department,
          subjectIds: subjectId ? [subjectId] : [],
          maxClassesPerDay: Number(maxClassesPerDay),
          maxClassesPerWeek: Number(maxClassesPerWeek),
          maxConsecutiveClasses: Number(maxConsecutiveClasses),
          availability,
        });
      }}
      className="space-y-4"
    >
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} required />
      <Select
        label="Subject"
        value={subjectId}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          setSubjectId(e.target.value);
        }}
        required
      >
        <option value="" disabled>Select a subject</option>
        {(list.data ?? []).map((s: any) => (
          <option key={s._id} value={s._id}>
            {s.subjectName} ({s.subjectCode})
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input label="Max classes / day" type="number" min={1} max={24} value={maxClassesPerDay} onChange={(event) => setMaxClassesPerDay(event.target.value)} />
        <Input label="Max classes / week" type="number" min={1} max={168} value={maxClassesPerWeek} onChange={(event) => setMaxClassesPerWeek(event.target.value)} />
        <Input label="Max consecutive classes" type="number" min={1} max={24} value={maxConsecutiveClasses} onChange={(event) => setMaxConsecutiveClasses(event.target.value)} />
      </div>
      <fieldset className="rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">Unavailable periods</legend>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {days.map((day) => (
            <Input
              key={day}
              label={day}
              placeholder="e.g. 0,1,5"
              value={unavailablePeriods[day] ?? ""}
              onChange={(event) => setUnavailablePeriods((old) => ({ ...old, [day]: event.target.value }))}
            />
          ))}
        </div>
      </fieldset>
      <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save teacher"}</Button>
    </form>
  );
}
