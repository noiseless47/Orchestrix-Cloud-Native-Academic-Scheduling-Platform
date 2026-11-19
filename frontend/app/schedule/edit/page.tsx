"use client";

import { useMemo, useState } from "react";
import { useSchedule } from "@/hooks/useSchedule";
import { moveScheduleSlot, swapScheduleSlots } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/hooks/useToast";
import { DAYS } from "@/lib/helpers";

type Location = { sectionName: string; day: string; period: number };

export default function EditSchedulePage() {
  const { list } = useSchedule();
  const { toast } = useToast();
  const routine = list.data;
  const sections = routine?.sections ?? [];
  const [sectionName, setSectionName] = useState("");
  const [source, setSource] = useState<Location | null>(null);
  const [swapTarget, setSwapTarget] = useState<Location | null>(null);
  const [busy, setBusy] = useState(false);
  const periods = routine?.periodsPerDay ?? 6;

  const currentSection = useMemo(
    () => sections.find((section: any) => section.name === (sectionName || sections[0]?.name)),
    [sections, sectionName],
  );

  const selectLocation = (day: string, period: number) => {
    const location = { sectionName: currentSection?.name, day, period };
    if (!source) {
      if (!currentSection?.timetable?.[day]?.[period]) {
        toast("Select a filled class slot as the source.", "error");
        return;
      }
      setSource(location);
      toast("Source selected. Choose an occupied class to swap or an empty class to move.");
      return;
    }
    if (source.sectionName === location.sectionName && source.day === location.day && source.period === location.period) {
      setSource(null);
      setSwapTarget(null);
      return;
    }
    setSwapTarget(location);
  };

  const moveSource = async (target: Location) => {
    if (!source || !routine?._id) return;
    setBusy(true);
    try {
      await moveScheduleSlot(routine._id, {
        sectionName: source.sectionName,
        fromDay: source.day,
        fromPeriod: source.period,
        toDay: target.day,
        toPeriod: target.period,
      });
      await list.refetch();
      toast("Class moved successfully.");
      setSource(null);
      setSwapTarget(null);
    } catch (error: any) {
      toast(error?.response?.data?.message || "The move could not be applied.", "error");
    } finally {
      setBusy(false);
    }
  };

  const swapSources = async () => {
    if (!source || !swapTarget || !routine?._id) return;
    setBusy(true);
    try {
      await swapScheduleSlots(routine._id, { first: source, second: swapTarget });
      await list.refetch();
      toast("Classes swapped successfully.");
      setSource(null);
      setSwapTarget(null);
    } catch (error: any) {
      toast(error?.response?.data?.message || "The swap could not be applied.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (list.isLoading) return <div className="page-heading"><h1>Loading schedule editor...</h1></div>;
  if (!sections.length) return <div className="page-heading"><h1>No schedule to edit</h1><p>Generate a routine first.</p></div>;

  return (
    <div className="space-y-5">
      <PageHeader title="Edit schedule" description="Move or swap classes with conflict-safe validation." />
      <div className="rounded-md border bg-white p-4 space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Section"
            value={currentSection?.name ?? ""}
            onChange={(event) => {
              setSectionName(event.target.value);
              setSource(null);
              setSwapTarget(null);
            }}
          >
            {sections.map((section: any) => <option key={section.name} value={section.name}>{section.name}</option>)}
          </Select>
          {source && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
              Source: {source.day}, Period {source.period + 1}
            </div>
          )}
          {swapTarget && (
            <Button disabled={busy} onClick={swapSources}>Swap selected classes</Button>
          )}
        </div>

        <div className="overflow-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 text-left">Day</th>
                {Array.from({ length: periods }, (_, period) => <th key={period} className="p-2 text-left">P{period + 1}</th>)}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day} className="border-t">
                  <td className="p-2 font-medium">{day}</td>
                  {Array.from({ length: periods }, (_, period) => {
                    const slot = currentSection?.timetable?.[day]?.[period];
                    const isSource = source?.day === day && source.period === period && source.sectionName === currentSection?.name;
                    const isTarget = swapTarget?.day === day && swapTarget.period === period && swapTarget.sectionName === currentSection?.name;
                    return (
                      <td key={period} className="p-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (source && !slot) {
                              moveSource({ sectionName: currentSection.name, day, period });
                            } else {
                              selectLocation(day, period);
                            }
                          }}
                          className={`min-h-16 w-full rounded-md border p-2 text-left ${isSource ? "border-green-700 bg-green-100" : isTarget ? "border-amber-500 bg-amber-50" : slot ? "bg-white" : "bg-gray-50"}`}
                        >
                          <span className="block font-medium">
                            {slot?.subjectCode || ((routine?.meta?.holidays?.[currentSection.name] || []).includes(day) ? "Holiday" : "")}
                          </span>
                          <span className="block text-xs text-gray-500">{slot?.subjectName || ""}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
