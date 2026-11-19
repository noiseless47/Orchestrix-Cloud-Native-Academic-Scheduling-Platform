"use client";
import DataTable from "@/components/table/DataTable";
import SectionForm from "@/components/forms/SectionForm";
import { useSections } from "@/hooks/useSections";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Section } from "@/lib/types";
import { useToast } from "@/hooks/useToast";

export default function SectionsPage() {
  const { list, createM } = useSections();
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-4">
        <PageHeader title="Sections" description="Organize student groups by department and year.">
          <Button onClick={() => setShowForm((v) => !v)}>Add Section</Button>
        </PageHeader>
        {showForm && (
          <div className="rounded-md border bg-white p-4">
            <SectionForm isPending={createM.isPending} onSubmit={(data) => createM.mutate(data, { onSuccess: () => { setShowForm(false); toast("Section added successfully."); }, onError: () => toast("Could not add section. Check the form and try again.", "error") })} />
          </div>
        )}
        {list.isError && (
          <div className="rounded-md border bg-white p-4">
            <div className="text-sm text-red-600 mb-2">Failed to load sections.</div>
            <div className="text-xs text-gray-600 mb-3">{String((list.error as any)?.message ?? "Unknown error")}</div>
            <Button variant="secondary" onClick={() => list.refetch().then((result) => result.isError ? toast("Could not load sections. Please retry.", "error") : toast("Sections refreshed."))}>Retry</Button>
          </div>
        )}
        <DataTable<Section>
          columns={[
            { key: "name", label: "Name" },
            { key: "department", label: "Department" },
            { key: "year", label: "Year" },
          ]}
          rows={list.data ?? []}
          loading={list.isLoading}
          emptyTitle="No sections"
          emptyDescription="Create sections for the selected year."
          renderCell={(item, columnKey) => {
            switch (columnKey) {
              case "name":
                return item.name;
              case "department":
                return item.department;
              case "year":
                return item.year;
              default:
                return null;
            }
          }}
        />
    </div>
  );
}
