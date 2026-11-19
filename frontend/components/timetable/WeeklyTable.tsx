"use client";

import { DAYS, range } from "@/lib/helpers";

type Cell = { subject?: string; teacher?: string; room?: string };

export default function WeeklyTable({ periods = 6, data }: { periods?: number; data: Cell[][] }) {
  return (
    <div className="timetable-scroll" role="region" aria-label="Weekly timetable" tabIndex={0}>
      <table className="timetable-table">
        <caption className="sr-only">Weekly class timetable by day and period</caption>
        <colgroup><col className="timetable-day-column" />{range(periods).map((period) => <col key={period} />)}</colgroup>
        <thead>
          <tr>
            <th scope="col" className="timetable-day-head">Day</th>
            {range(periods).map((period) => <th scope="col" key={period}>Period {period + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, dayIndex) => (
            <tr key={day}>
              <th scope="row" className="timetable-day-name">{day}</th>
              {range(periods).map((period) => {
                const cell = data?.[dayIndex]?.[period];
                const isHoliday = cell?.subject === "Holiday";
                const isFree = !cell?.subject || cell.subject === "-";
                return <td key={period}>
                  <div className={`timetable-slot ${isHoliday ? "timetable-slot-holiday" : isFree ? "timetable-slot-free" : "timetable-slot-class"}`}>
                    <span className="timetable-slot-subject">{isHoliday ? "Holiday" : isFree ? "Free period" : cell.subject}</span>
                    {!isHoliday && !isFree && cell?.teacher && <span className="timetable-slot-teacher">{cell.teacher}</span>}
                    {!isHoliday && !isFree && cell?.room && <span className="timetable-slot-room">Room {cell.room}</span>}
                  </div>
                </td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
