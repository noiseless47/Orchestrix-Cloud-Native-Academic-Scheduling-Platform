"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useTeachers } from "@/hooks/useTeachers";
import { useSections } from "@/hooks/useSections";
import { useSchedule } from "@/hooks/useSchedule";
import { getSubjects } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import type { Section, Subject, Teacher } from "@/lib/types";

type SubjectOption = Subject & { defaultClassesPerWeek?: number };
type SubjectRow = { subjectId: string; teacherId: string; weekly: number };
type SectionSetup = { id: string; name: string; subjects: SubjectRow[]; holidays: string[] };
type Cohort = { key: string; semester: number; batchYear: number; year: number };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function errorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Could not load the scheduling data. Please retry.";
}

export default function RoutineWizard() {
  const router = useRouter();
  const { list: teachersQuery } = useTeachers();
  const { list: sectionsQuery } = useSections();
  const { generateM } = useSchedule();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [department, setDepartment] = useState("");
  const [cohortKey, setCohortKey] = useState("");
  const [sections, setSections] = useState<SectionSetup[]>([]);
  const [constraints, setConstraints] = useState({
    maxClassesPerDay: 4,
    maxClassesPerWeek: 18,
    maxConsecutiveClasses: 2,
    requireSubjectSpread: true,
    requireTeacherBalance: true,
  });

  const sectionRecords: Section[] = sectionsQuery.data ?? [];
  const teacherOptions: Teacher[] = teachersQuery.data ?? [];
  const departments = useMemo(() => [...new Set(sectionRecords.map((section) => section.department).filter(Boolean))].sort(), [sectionRecords]);
  const cohorts = useMemo<Cohort[]>(() => {
    const matching = sectionRecords.filter((section) => section.department === department);
    const unique = new Map<string, Cohort>();
    for (const section of matching) {
      const key = `${section.semester}:${section.batchYear}`;
      unique.set(key, { key, semester: section.semester, batchYear: section.batchYear, year: section.year });
    }
    return [...unique.values()].sort((a, b) => a.semester - b.semester || a.batchYear - b.batchYear);
  }, [sectionRecords, department]);
  const selectedCohort = cohorts.find((cohort) => cohort.key === cohortKey) ?? cohorts[0];
  const matchingSections = useMemo(() => selectedCohort
    ? sectionRecords.filter((section) => section.department === department && section.semester === selectedCohort.semester && section.batchYear === selectedCohort.batchYear)
    : [], [sectionRecords, department, selectedCohort]);

  useEffect(() => {
    if (!department && departments.length) setDepartment(departments.includes("ISE") ? "ISE" : departments[0]);
  }, [department, departments]);

  useEffect(() => {
    if (!cohorts.some((cohort) => cohort.key === cohortKey)) setCohortKey(cohorts[0]?.key ?? "");
  }, [cohorts, cohortKey]);

  const subjectsQuery = useQuery<SubjectOption[]>({
    queryKey: ["subjects", "routine-generator", department, selectedCohort?.semester],
    queryFn: () => getSubjects({ department, semester: selectedCohort?.semester }),
    enabled: Boolean(department && selectedCohort),
  });
  const subjectOptions: SubjectOption[] = subjectsQuery.data ?? [];
  const eligibleTeachersFor = (subjectId: string) => teacherOptions.filter((teacher) =>
    teacher.subjects?.some((item) => String(item?._id ?? item) === subjectId),
  );
  const schedulableSubjects = useMemo(() => subjectOptions.filter((subject) =>
    Number(subject.defaultClassesPerWeek) > 0 && eligibleTeachersFor(subject._id).length > 0,
  ), [subjectOptions, teacherOptions]);
  const subjectsWithoutAssignments = subjectOptions.filter((subject) =>
    !(Number(subject.defaultClassesPerWeek) > 0) || eligibleTeachersFor(subject._id).length === 0,
  );

  useEffect(() => {
    if (generateM.isSuccess) {
      toast("Routine generated successfully.");
      generateM.reset();
      router.push("/schedule/view");
    }
  }, [generateM.isSuccess, generateM, router, toast]);

  useEffect(() => {
    if (generateM.isError) {
      toast(errorMessage(generateM.error), "error");
      generateM.reset();
    }
  }, [generateM.isError, generateM.error, generateM, toast]);

  const initializedSections = sections.length > 0
    && sections.every((section) => matchingSections.some((record) => record._id === section.id));
  const canContinue = Boolean(selectedCohort && matchingSections.length && schedulableSubjects.length
    && !sectionsQuery.isLoading && !sectionsQuery.isError && !subjectsQuery.isLoading && !subjectsQuery.isError
    && !teachersQuery.isLoading && !teachersQuery.isError);
  const canReview = sections.length > 0 && sections.every((section) => section.subjects.length > 0
    && section.subjects.every((row) => row.subjectId && row.teacherId && Number.isFinite(row.weekly) && row.weekly > 0));

  const initializeSections = () => {
    const teacherLoads = new Map<string, number>();
    const preparedSections = matchingSections.map((section) => ({ id: section._id, name: section.name, subjects: [] as SubjectRow[], holidays: section.holidays ?? [] }));
    for (const subject of schedulableSubjects) {
      const weekly = Number(subject.defaultClassesPerWeek);
      for (const section of preparedSections) {
        const candidates = eligibleTeachersFor(subject._id).sort((left, right) =>
          (teacherLoads.get(left._id) ?? 0) - (teacherLoads.get(right._id) ?? 0)
          || left.name.localeCompare(right.name),
        );
        const teacher = candidates[0];
        if (!teacher) continue;
        section.subjects.push({ subjectId: subject._id, teacherId: teacher._id, weekly });
        teacherLoads.set(teacher._id, (teacherLoads.get(teacher._id) ?? 0) + weekly);
      }
    }
    setSections(preparedSections);
    setStep(2);
  };

  const addSubject = (sectionIndex: number) => {
    setSections((current) => current.map((section, index) => index === sectionIndex
      ? { ...section, subjects: [...section.subjects, { subjectId: "", teacherId: "", weekly: 3 }] }
      : section));
  };

  const updateSubject = (sectionIndex: number, rowIndex: number, patch: Partial<SubjectRow>) => {
    setSections((current) => current.map((section, index) => index === sectionIndex
      ? { ...section, subjects: section.subjects.map((row, rowPosition) => rowPosition === rowIndex ? { ...row, ...patch } : row) }
      : section));
  };

  const removeSubject = (sectionIndex: number, rowIndex: number) => {
    setSections((current) => current.map((section, index) => index === sectionIndex
      ? { ...section, subjects: section.subjects.filter((_, rowPosition) => rowPosition !== rowIndex) }
      : section));
  };

  const toggleHoliday = (sectionIndex: number, day: string) => {
    setSections((current) => current.map((section, index) => {
      if (index !== sectionIndex) return section;
      const holidays = new Set(section.holidays);
      holidays.has(day) ? holidays.delete(day) : holidays.add(day);
      return { ...section, holidays: [...holidays] };
    }));
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-6" aria-labelledby="routine-setup-title">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="routine-setup-title" className="text-lg font-semibold text-gray-900">Build a routine</h2>
            <p className="mt-1 text-sm text-gray-600">Choose a configured cohort, assign its subjects and teachers, then generate.</p>
          </div>
          <ol className="flex items-center gap-2 text-xs text-gray-600" aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map((item) => <li key={item} aria-current={step === item ? "step" : undefined} className={`rounded-full px-3 py-2 ${step === item ? "bg-green-100 font-semibold text-green-900" : "bg-gray-100"}`}>Step {item}</li>)}
          </ol>
        </div>

        {step === 1 && (
          <div className="space-y-5">
            {sectionsQuery.isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
                <p className="font-semibold">Could not load sections</p><p className="mt-1">{errorMessage(sectionsQuery.error)}</p>
                <Button className="mt-3" variant="secondary" onClick={() => sectionsQuery.refetch()}>Retry</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Select label="Department" value={department} disabled={sectionsQuery.isLoading || !departments.length} onChange={(event) => { setDepartment(event.target.value); setCohortKey(""); setSections([]); }}>
                  {!departments.length && <option value="">{sectionsQuery.isLoading ? "Loading departments…" : "No configured departments"}</option>}
                  {departments.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Select label="Semester and batch" value={selectedCohort?.key ?? ""} disabled={!cohorts.length} onChange={(event) => { setCohortKey(event.target.value); setSections([]); }}>
                  {!cohorts.length && <option value="">No configured cohorts</option>}
                  {cohorts.map((cohort) => <option key={cohort.key} value={cohort.key}>Semester {cohort.semester} · Class of {cohort.batchYear}</option>)}
                </Select>
              </div>
            )}

            {sectionsQuery.isLoading && <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-600" role="status"><LoaderCircle className="animate-spin" size={17} />Loading configured cohorts…</div>}
            {!sectionsQuery.isLoading && !sectionsQuery.isError && matchingSections.length > 0 && (
              <div className="rounded-xl border border-green-200 bg-green-50/70 p-4" aria-live="polite">
                <p className="text-sm font-semibold text-green-950">{matchingSections.length} configured {matchingSections.length === 1 ? "section" : "sections"}</p>
                <p className="mt-1 text-sm text-green-900">{matchingSections.map((section) => section.name).join(", ")} · Year {selectedCohort?.year} · Semester {selectedCohort?.semester} · Batch {selectedCohort?.batchYear}</p>
              </div>
            )}
            {!sectionsQuery.isLoading && !sectionsQuery.isError && !matchingSections.length && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
                <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>No sections are configured for this cohort yet. Create sections on the Sections page before generating its schedule.</p>
              </div>
            )}
            {!sectionsQuery.isLoading && !sectionsQuery.isError && matchingSections.length > 0 && (
              <div className="space-y-2">
                {subjectsQuery.isLoading || teachersQuery.isLoading ? <p className="text-sm text-gray-600" role="status">Loading semester subjects, credits, and teacher links…</p> : null}
                {subjectsQuery.isError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">Could not load subjects. <button className="font-semibold underline focus-visible:outline focus-visible:outline-2" onClick={() => subjectsQuery.refetch()}>Retry</button></div>}
                {teachersQuery.isError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">Could not load teacher assignments. <button className="font-semibold underline focus-visible:outline focus-visible:outline-2" onClick={() => teachersQuery.refetch()}>Retry</button></div>}
                {!subjectsQuery.isLoading && !subjectsQuery.isError && !teachersQuery.isLoading && !teachersQuery.isError && subjectOptions.length > 0 && (
                  <div className={`rounded-xl border p-4 text-sm ${schedulableSubjects.length ? "border-blue-200 bg-blue-50 text-blue-950" : "border-amber-200 bg-amber-50 text-amber-950"}`} role="status">
                    <p className="font-semibold">{schedulableSubjects.length} subjects will be loaded automatically for each section.</p>
                    <p className="mt-1">Weekly class counts come from the subject records; teachers come from each teacher’s linked subjects and are distributed across sections.</p>
                    {subjectsWithoutAssignments.length > 0 && <p className="mt-2">{subjectsWithoutAssignments.length} catalog {subjectsWithoutAssignments.length === 1 ? "subject is" : "subjects are"} missing a weekly credit or linked teacher and will be skipped: {subjectsWithoutAssignments.map((subject) => subject.subjectCode).join(", ")}.</p>}
                  </div>
                )}
                {!subjectsQuery.isLoading && !subjectsQuery.isError && !subjectOptions.length && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">No catalog subjects are registered for {department}, semester {selectedCohort?.semester}.</p>}
              </div>
            )}
            <div className="flex justify-end">
              <Button disabled={!canContinue} onClick={initializeSections}>{subjectsQuery.isLoading || teachersQuery.isLoading ? "Loading catalog…" : "Review loaded subjects"}</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {sections.map((section, sectionIndex) => (
              <section key={section.id} className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <div><h3 className="font-semibold text-gray-900">Section {section.name}</h3><p className="text-xs text-gray-600">Choose subjects and eligible teachers for this class.</p></div>
                  <Button type="button" variant="secondary" onClick={() => addSubject(sectionIndex)} disabled={!subjectOptions.length}><Plus size={16} aria-hidden="true" />Add subject</Button>
                </div>
                <div className="space-y-4 p-4">
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium text-gray-800">Days off</legend>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((day) => <label key={day} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm hover:bg-gray-50">
                        <input type="checkbox" checked={section.holidays.includes(day)} onChange={() => toggleHoliday(sectionIndex, day)} />{day}
                      </label>)}
                    </div>
                  </fieldset>

                  {subjectsQuery.isLoading && <p className="text-sm text-gray-600" role="status">Loading semester subjects…</p>}
                  {subjectsQuery.isError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">Could not load subjects. <button className="font-semibold underline focus-visible:outline focus-visible:outline-2" onClick={() => subjectsQuery.refetch()}>Retry</button></div>}
                  {!subjectsQuery.isLoading && !subjectsQuery.isError && !subjectOptions.length && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">No subjects are registered for {department}, semester {selectedCohort?.semester}.</p>}
                  {!teachersQuery.isLoading && teachersQuery.isError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">Could not load teachers. <button className="font-semibold underline focus-visible:outline focus-visible:outline-2" onClick={() => teachersQuery.refetch()}>Retry</button></div>}

                  <div className="space-y-3">
                    {section.subjects.map((row, rowIndex) => {
                      const subject = subjectOptions.find((item) => item._id === row.subjectId);
                      const eligibleTeachers = eligibleTeachersFor(row.subjectId);
                      const usedIds = new Set(section.subjects.filter((_, index) => index !== rowIndex).map((item) => item.subjectId).filter(Boolean));
                      return <div key={`${section.id}-${rowIndex}`} className="grid grid-cols-1 items-end gap-3 rounded-xl border border-gray-200 p-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_150px_auto] md:p-4">
                        <Select label="Subject" value={row.subjectId} onChange={(event) => {
                          const nextId = event.target.value;
                          const nextSubject = subjectOptions.find((item) => item._id === nextId);
                          updateSubject(sectionIndex, rowIndex, { subjectId: nextId, teacherId: "", weekly: nextSubject?.defaultClassesPerWeek || 3 });
                        }}>
                          <option value="">Select a subject</option>
                          {subjectOptions.map((item) => <option key={item._id} value={item._id} disabled={usedIds.has(item._id)}>{item.subjectName} ({item.subjectCode}){item.electiveGroup ? ` · Group ${item.electiveGroup}` : ""}</option>)}
                        </Select>
                        <Select label="Teacher" value={row.teacherId} disabled={!row.subjectId || teachersQuery.isLoading || teachersQuery.isError} onChange={(event) => updateSubject(sectionIndex, rowIndex, { teacherId: event.target.value })}>
                          <option value="">{!row.subjectId ? "Select a subject first" : eligibleTeachers.length ? "Select an eligible teacher" : "No teacher linked to this subject"}</option>
                          {eligibleTeachers.map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.name}</option>)}
                        </Select>
                        <Input label="Classes per week" type="number" min={1} max={42} value={String(row.weekly)} onChange={(event) => updateSubject(sectionIndex, rowIndex, { weekly: Math.max(1, Math.min(42, Number(event.target.value) || 1)) })} />
                        <Button type="button" variant="ghost" className="min-h-11 text-red-700 hover:bg-red-50 hover:text-red-800" aria-label={`Remove subject row ${rowIndex + 1} from section ${section.name}`} onClick={() => removeSubject(sectionIndex, rowIndex)}><Trash2 size={16} aria-hidden="true" /><span className="md:hidden">Remove subject</span></Button>
                        {row.subjectId && !eligibleTeachers.length && !teachersQuery.isLoading && !teachersQuery.isError && <p className="text-xs text-amber-800 md:col-span-4">Assign a teacher to this subject on the Teachers page before including it in a schedule.</p>}
                      </div>;
                    })}
                    {section.subjects.length === 0 && <p className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-600">No subjects added to this schedule yet.</p>}
                  </div>
                </div>
              </section>
            ))}
            <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)} disabled={!canReview || subjectsQuery.isLoading || teachersQuery.isLoading}>Review schedule</Button>
            </div>
          </div>
        )}

        {step === 3 && selectedCohort && (
          <div className="space-y-5">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-950">
              Generating a schedule for <strong>{department}</strong>, Year <strong>{selectedCohort.year}</strong>, Semester <strong>{selectedCohort.semester}</strong>, Batch <strong>{selectedCohort.batchYear}</strong>.
            </div>
            <section className="rounded-xl border border-gray-200 p-4 sm:p-5" aria-labelledby="constraints-title">
              <h3 id="constraints-title" className="mb-4 font-semibold text-gray-900">Scheduling constraints</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Input label="Max classes per teacher per day" type="number" min={1} max={24} value={String(constraints.maxClassesPerDay)} onChange={(event) => setConstraints((old) => ({ ...old, maxClassesPerDay: Math.max(1, Math.min(24, Number(event.target.value) || 1)) }))} />
                <Input label="Max classes per teacher per week" type="number" min={1} max={168} value={String(constraints.maxClassesPerWeek)} onChange={(event) => setConstraints((old) => ({ ...old, maxClassesPerWeek: Math.max(1, Math.min(168, Number(event.target.value) || 1)) }))} />
                <Input label="Max consecutive classes" type="number" min={1} max={24} value={String(constraints.maxConsecutiveClasses)} onChange={(event) => setConstraints((old) => ({ ...old, maxConsecutiveClasses: Math.max(1, Math.min(24, Number(event.target.value) || 1)) }))} />
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-6">
                <label className="flex min-h-11 items-center gap-2 text-sm text-gray-800"><input type="checkbox" checked={constraints.requireSubjectSpread} onChange={(event) => setConstraints((old) => ({ ...old, requireSubjectSpread: event.target.checked }))} />Spread repeated subjects across days</label>
                <label className="flex min-h-11 items-center gap-2 text-sm text-gray-800"><input type="checkbox" checked={constraints.requireTeacherBalance} onChange={(event) => setConstraints((old) => ({ ...old, requireTeacherBalance: event.target.checked }))} />Balance teacher workload</label>
              </div>
            </section>

            <div className="space-y-3">
              {sections.map((section) => <section key={section.id} className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">Section {section.name}</h3>
                <p className="mt-1 text-xs text-gray-600">Days off: {section.holidays.length ? section.holidays.join(", ") : "None"}</p>
                <ul className="mt-3 divide-y divide-gray-100">
                  {section.subjects.map((row) => {
                    const subject = subjectOptions.find((item) => item._id === row.subjectId);
                    const teacher = teacherOptions.find((item) => item._id === row.teacherId);
                    return <li key={`${row.subjectId}-${row.teacherId}`} className="flex flex-wrap justify-between gap-x-5 gap-y-1 py-2 text-sm">
                      <span className="min-w-0"><span className="font-medium text-gray-900">{subject?.subjectName}</span><span className="ml-2 text-gray-500">{subject?.subjectCode} · {teacher?.name}</span></span>
                      <span className="shrink-0 text-gray-600">{row.weekly} classes/week</span>
                    </li>;
                  })}
                </ul>
              </section>)}
            </div>
            {generateM.isPending && <p className="flex items-center gap-2 text-sm text-green-900" role="status"><LoaderCircle className="animate-spin" size={17} />Generating schedule. This can take a moment…</p>}
            <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
              <Button variant="secondary" disabled={generateM.isPending} onClick={() => setStep(2)}>Back to assignments</Button>
              <Button disabled={generateM.isPending || !initializedSections} onClick={() => generateM.mutate({
                department,
                year: selectedCohort.year,
                semester: selectedCohort.semester,
                batchYear: selectedCohort.batchYear,
                constraints,
                sections: sections.map((section) => ({
                  name: section.name,
                  holidays: section.holidays,
                  subjects: section.subjects.map((row) => {
                    const subject = subjectOptions.find((item) => item._id === row.subjectId);
                    const teacher = teacherOptions.find((item) => item._id === row.teacherId);
                    return {
                      subjectId: row.subjectId,
                      subjectName: subject?.subjectName,
                      subjectCode: subject?.subjectCode,
                      teacherId: row.teacherId,
                      teacherName: teacher?.name,
                      classesPerWeek: row.weekly,
                    };
                  }),
                })),
              })}>
                {generateM.isPending ? "Generating…" : "Generate schedule"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
