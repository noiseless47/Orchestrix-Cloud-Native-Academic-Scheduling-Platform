import test from "node:test";
import assert from "node:assert/strict";
import { generateTimetable } from "../src/utils/scheduler.js";

const section = (name) => ({
  name,
  holidays: [],
  subjects: [
    {
      subjectId: "subject-a",
      subjectName: "Algorithms",
      subjectCode: "CS201",
      teacherId: "teacher-a",
      teacherName: "Teacher A",
      classesPerWeek: 3,
    },
  ],
});

test("schedules required classes without teacher collisions", () => {
  const result = generateTimetable({
    department: "ISE",
    year: 1,
    periodsPerDay: 6,
    sections: [section("A"), section("B")],
  });

  assert.equal(result.unsatisfied.length, 0);
  assert.equal(result.quality.conflictCount, 0);
});

test("honors section holidays", () => {
  const result = generateTimetable({
    department: "ISE",
    year: 1,
    periodsPerDay: 6,
    sections: [{ ...section("A"), holidays: ["Sunday"] }],
  });

  assert.deepEqual(result.sections[0].timetable.Sunday, [null, null, null, null, null, null]);
});

test("honors teacher unavailable periods", () => {
  const result = generateTimetable({
    department: "ISE",
    year: 1,
    periodsPerDay: 6,
    sections: [section("A")],
    teacherProfiles: {
      "teacher-a": {
        availability: [{ day: "Monday", periodsUnavailable: [0, 1, 2, 3, 4, 5] }],
      },
    },
  });

  assert.equal(result.sections[0].timetable.Monday.every((slot) => slot === null), true);
});

test("returns workload and quality metrics", () => {
  const result = generateTimetable({
    department: "ISE",
    year: 1,
    periodsPerDay: 6,
    sections: [section("A")],
  });

  assert.equal(typeof result.quality.score, "number");
  assert.equal(result.quality.score >= 0 && result.quality.score <= 100, true);
  assert.equal(Array.isArray(result.quality.teacherLoads), true);
  assert.equal(typeof result.quality.balance.score, "number");
});
