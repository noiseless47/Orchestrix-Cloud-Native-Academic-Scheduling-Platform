"use client";
import TeacherForm from "@/components/forms/TeacherForm";
import { useTeachers } from "@/hooks/useTeachers";
import { useToast } from "@/hooks/useToast";

export default function AddTeacherPage() {
  const { createM } = useTeachers();
  const { toast } = useToast();
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Add Teacher</h1>
      <TeacherForm isPending={createM.isPending} onSubmit={(data) => createM.mutate(data, { onSuccess: () => toast("Teacher added successfully."), onError: () => toast("Could not add teacher. Check the form and try again.", "error") })} />
    </div>
  );
}
