"use client";
import SectionForm from "@/components/forms/SectionForm";
import { useSections } from "@/hooks/useSections";
import { useToast } from "@/hooks/useToast";

export default function AddSectionPage() {
  const { createM } = useSections();
  const { toast } = useToast();
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Add Section</h1>
      <SectionForm isPending={createM.isPending} onSubmit={(data) => createM.mutate(data, { onSuccess: () => toast("Section added successfully."), onError: () => toast("Could not add section. Check the form and try again.", "error") })} />
    </div>
  );
}
