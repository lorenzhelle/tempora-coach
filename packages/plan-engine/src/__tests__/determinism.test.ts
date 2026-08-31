import { describe, expect, it } from "vitest";
import { generatePlan } from "../pipeline/index";
import type { PlanInput } from "../types";

const input: PlanInput = {
  goal: {
    distanceMeters: 5000,
    targetDate: "2027-08-29",
    targetTimeSeconds: 1200,
  },
  currentWeeklyVolumeKm: 10,
  currentRunsPerWeek: 3,
  longestRecentRunKm: 5,
  availableDaysPerWeek: 4,
  longRunDay: "sunday",
  experience: "returner",
  safetyScreenCompleted: true,
  personalBest: {
    distanceMeters: 5000,
    timeSeconds: 1295,
    achievedMonthsAgo: 24,
  },
  priorStressFracture: true,
  gymAccess: true,
  scheduleRegularity: "irregular",
  ageYears: 32,
  startDate: "2026-08-29",
  today: "2026-08-29",
};

describe("generatePlan determinism", () => {
  it("produces a deep-equal result (plan, fitness, feasibility, trace, violations) for the same input, called twice", () => {
    const first = generatePlan(input);
    const second = generatePlan({ ...input });
    expect(second).toEqual(first);
  });

  it("produces a deep-equal result for a plain object literal, not just a spread copy", () => {
    const first = generatePlan(input);
    const second = generatePlan(JSON.parse(JSON.stringify(input)));
    expect(second).toEqual(first);
  });
});
