import { DAYS } from "./constants.js";
import { shuffleArray } from "./shuffle.js";

const DEFAULT_SOFT_WEIGHTS = {
  subjectSpread: 18,
  teacherBalance: 16,
  avoidEdgePeriods: 5,
  avoidTeacherGaps: 8,
  avoidSameSubjectAdjacentDays: 14,
};

function asPeriodSet(profile, periodsPerDay) {
  const values = new Set();
  for (const raw of profile?.availability?.periodsUnavailable || []) {
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    if (value >= 0 && value < periodsPerDay) values.add(value);
  }
  return values;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashSeed(value) {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function normalizeConstraints(raw = {}) {
  return {
    periodsPerDayMaxTeacher: raw.periodsPerDayMaxTeacher == null ? null : clamp(Number(raw.periodsPerDayMaxTeacher), 1, 24),
    maxClassesPerDay: raw.maxClassesPerDay == null ? null : clamp(Number(raw.maxClassesPerDay), 1, 24),
    maxClassesPerWeek: raw.maxClassesPerWeek == null ? null : clamp(Number(raw.maxClassesPerWeek), 1, 168),
    maxConsecutiveClasses: raw.maxConsecutiveClasses == null ? null : clamp(Number(raw.maxConsecutiveClasses), 1, 24),
    requireSubjectSpread: raw.requireSubjectSpread !== false,
    requireTeacherBalance: raw.requireTeacherBalance !== false,
    softWeights: { ...DEFAULT_SOFT_WEIGHTS, ...(raw.softWeights || {}) },
  };
}

export function generateTimetable({
  department,
  year,
  periodsPerDay,
  sections,
  constraints = {},
  teacherProfiles = {},
}) {
  const normalized = normalizeConstraints(constraints);
  const weights = normalized.softWeights;
  const weightsNormalized = Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, Number.isFinite(Number(value)) ? Number(value) : DEFAULT_SOFT_WEIGHTS[key] || 0]),
  );

  const sectionSlots = sections.map((section) => {
    const holidaySet = new Set(section.holidays || []);
    const allowedDays = DAYS.filter((day) => !holidaySet.has(day));
    const timetable = {};
    DAYS.forEach((day) => {
      timetable[day] = Array.from({ length: periodsPerDay }, () => null);
    });

    const subjects = (section.subjects || []).map((subject) => ({
      subjectId: String(subject.subjectId),
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      teacherId: String(subject.teacherId),
      teacherName: subject.teacherName,
      remaining: Math.max(0, Number(subject.classesPerWeek || 0)),
      dayCounts: {},
    }));

    return { name: section.name, allowedDays, holidaySet, timetable, subjects };
  });

  const teacherBusy = new Map();
  const teacherLoads = new Map();
  const teacherDailyLoads = new Map();
  const teacherPeriods = new Map();

  const busyAt = (day, period) => {
    if (!teacherBusy.has(day)) teacherBusy.set(day, new Map());
    const dayMap = teacherBusy.get(day);
    if (!dayMap.has(period)) dayMap.set(period, new Set());
    return dayMap.get(period);
  };

  const profileFor = (teacherId) => teacherProfiles[String(teacherId)] || {};

  const dayLoadKey = (teacherId, day) => `${teacherId}:${day}`;

  const variables = [];
  sectionSlots.forEach((section, sectionIndex) => {
    section.subjects.forEach((subject, subjectIndex) => {
      for (let occurrence = 0; occurrence < subject.remaining; occurrence++) {
        variables.push({ sectionIndex, subjectIndex, occurrence });
      }
    });
  });

  const seed = hashSeed(`${department}-${year}-${periodsPerDay}-${sectionSlots.map((section) => section.name).join("-")}`);
  const shuffledVariables = shuffleArray(variables, seed);

  let assignmentCount = 0;
  let nodeCount = 0;
  const nodeLimit = 350000;
  let complete = false;
  let bestPartial = 0;

  const teacherAvailable = (teacherId, day, period) => {
    const profile = profileFor(teacherId);
    const availability = profile.availability || {};
    if (Array.isArray(availability)) {
      const dayRule = availability.find((rule) => rule.day === day);
      if (dayRule?.periodsUnavailable) {
        const unavailable = asPeriodSet({ availability: { periodsUnavailable: dayRule.periodsUnavailable } }, periodsPerDay);
        if (unavailable.has(period)) return false;
      }
    } else if (availability?.periodsUnavailable) {
      const unavailable = asPeriodSet(profile, periodsPerDay);
      if (unavailable.has(period)) return false;
    }

    const dayRule = (profile.availability || []).find?.((rule) => rule.day === day);
    if (dayRule?.periodsUnavailable) {
      if (asPeriodSet({ availability: { periodsUnavailable: dayRule.periodsUnavailable } }, periodsPerDay).has(period)) return false;
    }
    return true;
  };

  const teacherLimitReached = (teacherId, day) => {
    const profile = profileFor(teacherId);
    const profileMaxDay = Number(profile.maxClassesPerDay);
    const profileMaxWeek = Number(profile.maxClassesPerWeek);
    const maxDay = normalized.periodsPerDayMaxTeacher
      ?? normalized.maxClassesPerDay
      ?? (Number.isFinite(profileMaxDay) ? profileMaxDay : null);
    const maxWeek = normalized.maxClassesPerWeek ?? (Number.isFinite(profileMaxWeek) ? profileMaxWeek : null);
    const weeklyLoad = teacherLoads.get(teacherId) || 0;
    const dailyLoad = teacherDailyLoads.get(dayLoadKey(teacherId, day)) || 0;
    if (maxDay && dailyLoad >= maxDay) return true;
    if (maxWeek && weeklyLoad >= maxWeek) return true;
    return false;
  };

  const subjectConsecutivePenalty = (section, subject, day, period) => {
    if (!normalized.requireSubjectSpread) return 0;
    let penalty = 0;
    const dayIndex = DAYS.indexOf(day);
    const adjacentDays = [dayIndex - 1, dayIndex + 1].filter((index) => index >= 0 && index < DAYS.length);
    for (const index of adjacentDays) {
      const adjacent = section.timetable[DAYS[index]] || [];
      if (adjacent.some((slot) => slot?.subjectId === subject.subjectId)) penalty += 1;
    }
    if (period > 0 && section.timetable[day][period - 1]?.subjectId === subject.subjectId) penalty += 2;
    if (period + 1 < periodsPerDay && section.timetable[day][period + 1]?.subjectId === subject.subjectId) penalty += 2;
    return penalty;
  };

  const teacherConsecutiveLimitReached = (teacherId, day, period) => {
    const profile = profileFor(teacherId);
    const profileMax = Number(profile.maxConsecutiveClasses);
    const limit = normalized.maxConsecutiveClasses ?? (Number.isFinite(profileMax) ? profileMax : null);
    if (!limit) return false;

    let consecutive = 1;
    for (let previous = period - 1; previous >= 0; previous--) {
      const busy = busyAt(day, previous);
      if (busy.has(teacherId)) consecutive++;
      else break;
    }
    for (let next = period + 1; next < periodsPerDay; next++) {
      const busy = busyAt(day, next);
      if (busy.has(teacherId)) consecutive++;
      else break;
    }
    return consecutive > limit;
  };

  const averageTeacherLoad = () => {
    const loads = [...teacherLoads.values()];
    if (!loads.length) return 0;
    return loads.reduce((sum, load) => sum + load, 0) / loads.length;
  };

  const candidateScore = (section, subject, day, period) => {
    let score = 0;
    const edgeDistance = period === 0 || period === periodsPerDay - 1 ? 1 : 0;
    score += edgeDistance * weightsNormalized.avoidEdgePeriods;

    const subjectSpreadPenalty = subjectConsecutivePenalty(section, subject, day, period);
    score += subjectSpreadPenalty * weightsNormalized.subjectSpread;
    if (subjectSpreadPenalty > 0) {
      score += weightsNormalized.avoidSameSubjectAdjacentDays;
    }

    if (normalized.requireTeacherBalance) {
      const load = teacherLoads.get(subject.teacherId) || 0;
      score += load * weightsNormalized.teacherBalance;
    }

    const periodsOccupied = teacherPeriods.get(`${subject.teacherId}:${day}`) || new Set();
    if (periodsOccupied.size > 0) {
      const gapCount = [...periodsOccupied].filter(
        (occupiedPeriod) => Math.abs(occupiedPeriod - period) > 1,
      ).length;
      score += gapCount * weightsNormalized.avoidTeacherGaps;
    }

    return score;
  };

  const domainFor = (variable) => {
    const section = sectionSlots[variable.sectionIndex];
    const subject = section.subjects[variable.subjectIndex];
    const domain = [];

    for (const day of section.allowedDays) {
      for (let period = 0; period < periodsPerDay; period++) {
        if (section.timetable[day][period]) continue;
        if (!teacherAvailable(subject.teacherId, day, period)) continue;
        if (busyAt(day, period).has(subject.teacherId)) continue;
        if (teacherLimitReached(subject.teacherId, day)) continue;
        if (teacherConsecutiveLimitReached(subject.teacherId, day, period)) continue;
        domain.push({ day, period, score: 0 });
      }
    }

    for (const choice of domain) {
      choice.score = candidateScore(section, subject, choice.day, choice.period);
    }

    return domain.sort(
      (left, right) =>
        left.score - right.score ||
        Math.abs(left.period - (periodsPerDay - 1) / 2) -
          Math.abs(right.period - (periodsPerDay - 1) / 2),
    );
  };

  const selectVariable = (remaining) => {
    let selected = null;
    let selectedDomain = null;
    for (const variable of remaining) {
      const domain = domainFor(variable);
      if (selected === null || domain.length < selectedDomain.length) {
        selected = variable;
        selectedDomain = domain;
      }
      if (selectedDomain.length === 0) break;
    }
    return { variable: selected, domain: selectedDomain || [] };
  };

  function place(variable, choice) {
    const section = sectionSlots[variable.sectionIndex];
    const subject = section.subjects[variable.subjectIndex];
    section.timetable[choice.day][choice.period] = {
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      teacherId: subject.teacherId,
      teacherName: subject.teacherName,
      day: choice.day,
      period: choice.period,
    };
    busyAt(choice.day, choice.period).add(subject.teacherId);
    teacherLoads.set(subject.teacherId, (teacherLoads.get(subject.teacherId) || 0) + 1);
    const dayKey = dayLoadKey(subject.teacherId, choice.day);
    teacherDailyLoads.set(dayKey, (teacherDailyLoads.get(dayKey) || 0) + 1);
    const periodKey = `${subject.teacherId}:${choice.day}`;
    if (!teacherPeriods.has(periodKey)) teacherPeriods.set(periodKey, new Set());
    teacherPeriods.get(periodKey).add(choice.period);
    subject.dayCounts[choice.day] = (subject.dayCounts[choice.day] || 0) + 1;
  }

  function remove(variable, choice) {
    const section = sectionSlots[variable.sectionIndex];
    const subject = section.subjects[variable.subjectIndex];
    section.timetable[choice.day][choice.period] = null;
    busyAt(choice.day, choice.period).delete(subject.teacherId);
    teacherLoads.set(subject.teacherId, (teacherLoads.get(subject.teacherId) || 1) - 1);
    const dayKey = dayLoadKey(subject.teacherId, choice.day);
    teacherDailyLoads.set(dayKey, (teacherDailyLoads.get(dayKey) || 1) - 1);
    const periodKey = `${subject.teacherId}:${choice.day}`;
    teacherPeriods.get(periodKey)?.delete(choice.period);
    subject.dayCounts[choice.day] = Math.max(0, (subject.dayCounts[choice.day] || 1) - 1);
  }

  function backtrack(remaining) {
    nodeCount++;
    if (nodeCount > nodeLimit) return false;
    if (remaining.length === 0) {
      complete = true;
      return true;
    }

    const { variable, domain } = selectVariable(remaining);
    if (!variable || domain.length === 0) return false;
    const index = remaining.indexOf(variable);
    remaining.splice(index, 1);

    for (const choice of domain) {
      place(variable, choice);
      assignmentCount++;
      bestPartial = Math.max(bestPartial, assignmentCount);
      if (backtrack(remaining)) return true;
      remove(variable, choice);
      assignmentCount--;
    }

    remaining.splice(index, 0, variable);
    return false;
  }

  backtrack([...shuffledVariables]);

  const unsatisfied = [];
  const hardViolations = [];
  const softViolations = [];

  sectionSlots.forEach((section) => {
    const placedCount = new Map();
    DAYS.forEach((day) => {
      section.timetable[day].forEach((slot) => {
        if (slot) placedCount.set(slot.subjectId, (placedCount.get(slot.subjectId) || 0) + 1);
      });
    });
    section.subjects.forEach((subject) => {
      const count = placedCount.get(subject.subjectId) || 0;
      const remaining = Math.max(0, subject.remaining - count);
      if (remaining > 0) {
        unsatisfied.push({
          sectionName: section.name,
          subjectName: subject.subjectName,
          subjectCode: subject.subjectCode,
          teacherId: subject.teacherId,
          remaining,
        });
      }

      if (normalized.requireSubjectSpread) {
        const dayCounts = DAYS.map((day) =>
          section.timetable[day].filter((slot) => slot?.subjectId === subject.subjectId).length,
        );
        const adjacent = dayCounts.some((count, index) => index > 0 && count > 0 && dayCounts[index - 1] > 0);
        if (adjacent) softViolations.push({
          type: "subject-adjacency",
          sectionName: section.name,
          subjectName: subject.subjectName,
          message: "A subject is scheduled on adjacent days.",
        });
      }
    });
  });

  const teacherLoadEntries = [];
  for (const [teacherId, load] of teacherLoads.entries()) {
    teacherLoadEntries.push({ teacherId, weeklyClasses: load });
  }
  for (const profileId of Object.keys(teacherProfiles)) {
    if (!teacherLoads.has(profileId)) teacherLoadEntries.push({ teacherId: profileId, weeklyClasses: 0 });
  }

  const loads = teacherLoadEntries.map((entry) => entry.weeklyClasses).filter((load) => load > 0);
  const averageLoad = loads.length ? loads.reduce((sum, load) => sum + load, 0) / loads.length : 0;
  const maxLoad = loads.length ? Math.max(...loads) : 0;
  const minLoad = loads.length ? Math.min(...loads) : 0;
  const spread = maxLoad - minLoad;
  const balanceScore = averageLoad ? clamp(100 - (spread / averageLoad) * 100, 0, 100) : 100;

  let teacherCollisionCount = 0;
  let teacherAvailabilityViolationCount = 0;
  for (const day of DAYS) {
    for (let period = 0; period < periodsPerDay; period++) {
      const teachers = new Map();
      sectionSlots.forEach((section) => {
        const slot = section.timetable[day][period];
        if (!slot) return;
        if (teachers.has(slot.teacherId)) teacherCollisionCount++;
        teachers.set(slot.teacherId, section.name);
        if (!teacherAvailable(slot.teacherId, day, period)) teacherAvailabilityViolationCount++;
      });
    }
  }
  if (teacherCollisionCount) {
    hardViolations.push({ type: "teacher-collision", count: teacherCollisionCount, message: "A teacher is assigned to multiple sections at once." });
  }
  if (teacherAvailabilityViolationCount) {
    hardViolations.push({ type: "teacher-availability", count: teacherAvailabilityViolationCount, message: "A class violates teacher availability." });
  }

  let edgePeriodUsage = 0;
  sectionSlots.forEach((section) => {
    DAYS.forEach((day) => {
      if (section.timetable[day][0]) edgePeriodUsage++;
      if (section.timetable[day][periodsPerDay - 1]) edgePeriodUsage++;
    });
  });

  const penalty =
    hardViolations.length * 30 +
    unsatisfied.reduce((sum, item) => sum + item.remaining, 0) * 8 +
    softViolations.length * 3 +
    (100 - balanceScore) * 0.35 +
    edgePeriodUsage * weightsNormalized.avoidEdgePeriods * 0.2;
  const qualityScore = clamp(Math.round(100 - penalty), 0, 100);

  return {
    sections: sectionSlots.map((section) => ({
      name: section.name,
      holidays: [...section.holidaySet],
      timetable: section.timetable,
    })),
    unsatisfied,
    complete,
    quality: {
      score: qualityScore,
      hardViolationCount: hardViolations.length,
      conflictCount: teacherCollisionCount,
      unsatisfiedClassCount: unsatisfied.reduce((sum, item) => sum + item.remaining, 0),
      balance: {
        score: Math.round(balanceScore),
        averageLoad: Number(averageLoad.toFixed(2)),
        minLoad,
        maxLoad,
        spread,
      },
      teacherLoads: teacherLoadEntries.sort((left, right) => right.weeklyClasses - left.weeklyClasses),
      edgePeriodUsage,
      hardViolations,
      softViolations,
      algorithm: "MRV backtracking with teacher-availability, workload, balance, and spreading heuristics",
      nodesExplored: nodeCount,
      assignmentCount,
      bestPartial,
    },
  };
}
