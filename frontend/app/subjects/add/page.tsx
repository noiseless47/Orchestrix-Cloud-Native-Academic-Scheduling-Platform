"use client";
import SubjectForm from "@/components/forms/SubjectForm";
import { useSubjects } from "@/hooks/useSubjects";
import { useToast } from "@/hooks/useToast";

export default function AddSubjectPage() {
  const { createM } = useSubjects();
  const { toast } = useToast();
  return (
    <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">Add Subject</h1>
        <SubjectForm isPending={createM.isPending} onSubmit={(data) => createM.mutate(data, { onSuccess: () => toast("Subject added successfully."), onError: () => toast("Could not add subject. Check the form and try again.", "error") })} />
    </div>
  );
}
