import { describe, expect, it } from "vitest";
import { buildCurve } from "../pipeline/curve";
import { Tracer } from "../rules/define";
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
  experience: "beginner",
  safetyScreenCompleted: true,
  startDate: "2026-08-29",
  today: "2026-08-29",
};

describe("volume.taper", () => {
  it("cuts volume within Bosquet et al.'s 41-60% band for the final 2 weeks, holding elsewhere untouched", () => {
    const w = buildCurve(input, new Tracer()).weeks;
    const taperWeeks = w.filter((week) => week.isTaper);
    expect(taperWeeks).toHaveLength(2);

    const preTaperWeek = w[w.length - 3];
    expect(preTaperWeek?.isTaper).toBe(false);
    const preTaperKm = preTaperWeek?.targetVolumeKm ?? 0;

    for (const week of taperWeeks) {
      const reductionFraction = 1 - week.targetVolumeKm / preTaperKm;
      expect(reductionFraction).toBeGreaterThanOrEqual(0.41 - 1e-6);
      expect(reductionFraction).toBeLessThanOrEqual(0.6 + 1e-6);
    }
  });

  it("puts both taper weeks in the 'race' phase", () => {
    const w = buildCurve(input, new Tracer()).weeks;
    for (const week of w.filter((week) => week.isTaper)) {
      expect(week.phase).toBe("race");
    }
  });

  it("is a no-op distinction from a plain plateau week's volume — taper only ever reduces, never increases, volume", () => {
    const w = buildCurve(input, new Tracer()).weeks;
    const taperWeeks = w.filter((week) => week.isTaper);
    const preTaperWeek = w[w.length - taperWeeks.length - 1];
    for (const week of taperWeeks) {
      expect(week.targetVolumeKm).toBeLessThan(
        preTaperWeek?.targetVolumeKm ?? Number.POSITIVE_INFINITY,
      );
    }
  });

  it("does not apply when the horizon is too short to fit a taper (edge case: 1-week horizon)", () => {
    const shortInput: PlanInput = {
      ...input,
      startDate: "2026-08-29",
      goal: { ...input.goal, targetDate: "2026-09-05" },
    };
    const w = buildCurve(shortInput, new Tracer()).weeks;
    expect(w).toHaveLength(1);
    expect(w[0]?.isTaper).toBe(false);
  });
});
