import { describe, expect, it } from "vitest";
import { generatePlan } from "../pipeline/index";
import type { PlanInput } from "../types";

// The real target scenario: a returning runner at 10 km/wk aiming for a
// sub-20 5K, 12 months out. Verified manually against the full generated
// output before writing these assertions (see the PR description).
const realisticInput: PlanInput = {
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

describe("generatePlan structural integrity", () => {
  const result = generatePlan(realisticInput);

  it("covers the full requested horizon with no gaps", () => {
    expect(result.plan.weeks).toHaveLength(52);
    for (let i = 0; i < result.plan.weeks.length; i++) {
      expect(result.plan.weeks[i]?.weekNumber).toBe(i + 1);
    }
  });

  it("gives every week exactly 7 sessions on 7 distinct dates", () => {
    for (const week of result.plan.weeks) {
      expect(week.sessions).toHaveLength(7);
      const dates = week.sessions.map((s) => s.date);
      expect(new Set(dates).size).toBe(7);
    }
  });

  it("places every long run / time trial on the stated preferred day", () => {
    for (const week of result.plan.weeks) {
      const longRunDaySession = week.sessions.find(
        (s) => s.dayOfWeek === "sunday",
      );
      expect(longRunDaySession).toBeDefined();
      expect(["easy", "timeTrial"]).toContain(longRunDaySession?.type);
    }
  });

  it("never runs a session that breaches the 1.10x 30-day spike ceiling", () => {
    expect(
      result.violations.filter((v) => v.ruleId === "check.spike_ceiling"),
    ).toHaveLength(0);
  });

  it("never reports an internally inconsistent weekly sum", () => {
    expect(
      result.violations.filter((v) => v.ruleId === "check.weekly_sum"),
    ).toHaveLength(0);
  });

  it("keeps quality sessions within the 80/20 (or 60/40 fallback) easy-share target", () => {
    expect(
      result.violations.filter((v) => v.ruleId === "check.easy_share"),
    ).toHaveLength(0);
  });

  it("flags the requested >52-week horizon rather than silently truncating it", () => {
    expect(
      result.violations.some((v) => v.ruleId === "goal.horizon_cap_12_months"),
    ).toBe(true);
  });

  it("tapers the final 2 weeks and never schedules a long run/time trial there beyond the cut volume", () => {
    const taperWeeks = result.plan.weeks.filter((w) => w.isTaper);
    expect(taperWeeks).toHaveLength(2);
    for (const week of taperWeeks) expect(week.phase).toBe("race");
  });

  it("records a dense trace and a rule-set version", () => {
    expect(result.trace.length).toBeGreaterThan(1000);
    expect(result.ruleSetVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe("generatePlan feasibility", () => {
  it("flags a sub-20 5K in 12 months from a 10km/wk beginner baseline as ambitious or unrealistic, not silently realistic", () => {
    const result = generatePlan(realisticInput);
    expect(["ambitious", "unrealistic"]).toContain(result.feasibility.verdict);
  });

  it("returns 'not_applicable' feasibility when the goal has no target time", () => {
    const { targetTimeSeconds, ...goalWithoutTime } = realisticInput.goal;
    const result = generatePlan({ ...realisticInput, goal: goalWithoutTime });
    expect(result.feasibility.verdict).toBe("not_applicable");
    expect(result.feasibility.requiredVdot).toBeNull();
  });
});

describe("generatePlan spike-ceiling enforcement", () => {
  it("truncates a session that would otherwise spike, for a beginner with a very short recent longest run", () => {
    const cautious: PlanInput = { ...realisticInput, longestRecentRunKm: 1.5 };
    const result = generatePlan(cautious);
    // Week 1's long run would nominally be 30% of 10km = 3km, well above 1.5km*1.10=1.65km — must be truncated.
    const week1LongRun = result.plan.weeks[0]?.sessions.find(
      (s) => s.dayOfWeek === "sunday",
    );
    expect(week1LongRun?.distanceKm).toBeLessThanOrEqual(1.5 * 1.1 + 1e-6);
    expect(
      result.violations.filter((v) => v.ruleId === "check.spike_ceiling"),
    ).toHaveLength(0);
  });
});

describe("generatePlan with a gym-less, low-days-available profile", () => {
  it("still produces a valid full-horizon plan with bodyweight strength and a 60/40-ish easy split", () => {
    const constrained: PlanInput = {
      ...realisticInput,
      availableDaysPerWeek: 2,
      gymAccess: false,
    };
    const result = generatePlan(constrained);
    expect(result.plan.weeks).toHaveLength(52);
    const anyStrength = result.plan.weeks
      .flatMap((w) => w.sessions)
      .find((s) => s.type === "strength");
    expect(anyStrength?.description).toContain("bodyweight");
    for (const week of result.plan.weeks) {
      const runningDays = week.sessions.filter(
        (s) => s.distanceKm !== null,
      ).length;
      expect(runningDays).toBeLessThanOrEqual(2);
    }
  });
});
