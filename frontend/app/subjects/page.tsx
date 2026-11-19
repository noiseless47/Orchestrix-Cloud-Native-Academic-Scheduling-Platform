"use client";
import DataTable from "@/components/table/DataTable";
import SubjectForm from "@/components/forms/SubjectForm";
import { useSubjects } from "@/hooks/useSubjects";
import { Button } from "@/components/ui/Button";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Subject } from "@/lib/types";
import { useToast } from "@/hooks/useToast";
import { Select } from "@/components/ui/Select";

export default function SubjectsPage() {
  const { list, createM } = useSubjects();
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ department: "", year: "", semester: "", group: "" });
  const { toast } = useToast();
  const subjects: Subject[] = (list.data ?? []) as Subject[];
  const departments = useMemo(() => [...new Set(subjects.map((subject) => subject.department).filter(Boolean))].sort(), [subjects]);
  const semesters = useMemo(() => [...new Set(subjects.map((subject) => subject.semester).filter((semester): semester is number => semester != null))].sort((a, b) => a - b), [subjects]);
  const groups = useMemo(() => [...new Set(subjects.map((subject) => subject.electiveGroup).filter((group): group is string => Boolean(group)))].sort(), [subjects]);
  const filteredSubjects = useMemo(() => subjects.filter((subject) => {
    const year = subject.semester ? Math.ceil(subject.semester / 2) : undefined;
    return (!filters.department || subject.department === filters.department)
      && (!filters.year || String(year ?? "") === filters.year)
      && (!filters.semester || String(subject.semester ?? "") === filters.semester)
      && (!filters.group || (filters.group === "ungrouped" ? !subject.electiveGroup : subject.electiveGroup === filters.group));
  }), [subjects, filters]);
  const hasActiveFilters = Object.values(filters).some(Boolean);
  const clearFilters = () => setFilters({ department: "", year: "", semester: "", group: "" });

  return (
    <div className="space-y-4">
        <PageHeader title="Subjects" description="Maintain the department catalog used for teaching assignments.">
          <Button onClick={() => setShowForm((v) => !v)}>Add Subject</Button>
        </PageHeader>
        {showForm && (
          <div className="rounded-md border bg-white p-4">
            <SubjectForm isPending={createM.isPending} onSubmit={(data) => createM.mutate(data, { onSuccess: () => { setShowForm(false); toast("Subject added successfully."); }, onError: () => toast("Could not add subject. Check the form and try again.", "error") })} />
          </div>
        )}
        {list.isError && (
          <div className="rounded-md border bg-white p-4">
            <div className="text-sm text-red-600 mb-2">Failed to load subjects.</div>
            <div className="text-xs text-gray-600 mb-3">{String((list.error as any)?.message ?? "Unknown error")}</div>
            <Button variant="secondary" onClick={() => list.refetch().then((result) => result.isError ? toast("Could not load subjects. Please retry.", "error") : toast("Subjects refreshed."))}>Retry</Button>
          </div>
        )}
        <section className="subject-filter-panel" aria-label="Filter subjects">
          <div className="subject-filter-heading">
            <div><h2>Filters</h2><p>Refine the catalog by department, year, semester, or elective group.</p></div>
            {hasActiveFilters && <Button type="button" variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          </div>
          <div className="subject-filter-grid">
            <Select label="Department" value={filters.department} onChange={(event) => setFilters((current) => ({ ...current, department: event.target.value }))}>
              <option value="">All departments</option>
              {departments.map((department) => <option key={department} value={department}>{department}</option>)}
            </Select>
            <Select label="Year" value={filters.year} onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}>
              <option value="">All years</option>
              {[...new Set(semesters.map((semester) => Math.ceil(semester / 2)))].sort((a, b) => a - b).map((year) => <option key={year} value={year}>{year}{year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} Year</option>)}
            </Select>
            <Select label="Semester" value={filters.semester} onChange={(event) => setFilters((current) => ({ ...current, semester: event.target.value }))}>
              <option value="">All semesters</option>
              {semesters.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
            </Select>
            <Select label="Group" value={filters.group} onChange={(event) => setFilters((current) => ({ ...current, group: event.target.value }))}>
              <option value="">All groups</option>
              <option value="ungrouped">Ungrouped</option>
              {groups.map((group) => <option key={group} value={group}>Group {group}</option>)}
            </Select>
          </div>
          <p className="subject-filter-result" aria-live="polite">{filteredSubjects.length} {filteredSubjects.length === 1 ? "subject" : "subjects"}{hasActiveFilters ? " match these filters" : " in the catalog"}</p>
        </section>
        <DataTable<Subject>
          columns={[
            { key: "subjectName", label: "Name" },
            { key: "subjectCode", label: "Code" },
            { key: "department", label: "Department" },
            { key: "year", label: "Year" },
            { key: "semester", label: "Semester" },
            { key: "electiveGroup", label: "Group" },
          ]}
          rows={filteredSubjects}
          loading={list.isLoading}
          emptyTitle={hasActiveFilters ? "No subjects match these filters" : "No subjects"}
          emptyDescription={hasActiveFilters ? "Try changing or clearing your filters." : "Create your first subject to get started."}
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case "subjectName":
                return item.subjectName;
              case "subjectCode":
                return item.subjectCode;
              case "department":
                return item.department;
              case "year":
                if (!item.semester) return "—";
                const academicYear = Math.ceil(item.semester / 2);
                return `${academicYear}${academicYear === 1 ? "st" : academicYear === 2 ? "nd" : academicYear === 3 ? "rd" : "th"} Year`;
              case "semester":
                return item.semester ?? "—";
              case "electiveGroup":
                return item.electiveGroup ?? "—";
              default:
                return null;
            }
          }}
        />
    </div>
  );
}
