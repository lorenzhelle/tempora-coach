import { describe, expect, it } from "vitest";
import { generatePlan } from "../pipeline/index";
import { RULE_CATALOG } from "../rules/catalog";
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

describe("trace coverage", () => {
  const result = generatePlan(input);

  it("emits at least one Decision at plan scope", () => {
    expect(result.trace.some((d) => d.scope === "plan")).toBe(true);
  });

  it("emits at least one Decision for every week", () => {
    for (const week of result.plan.weeks) {
      const weekDecisions = result.trace.filter(
        (d) => d.targetId === `week-${week.weekNumber}`,
      );
      expect(weekDecisions.length).toBeGreaterThan(0);
    }
  });

  it("emits at least one Decision for every non-rest, non-strength session", () => {
    for (const week of result.plan.weeks) {
      for (const session of week.sessions) {
        if (session.type === "rest" || session.type === "strength") continue;
        const sessionDecisions = result.trace.filter(
          (d) => d.targetId === `week-${week.weekNumber}:${session.dayOfWeek}`,
        );
        expect(
          sessionDecisions.length,
          `week ${week.weekNumber} ${session.dayOfWeek} (${session.type}) has no trace entries`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("every emitted ruleId exists in RULE_CATALOG", () => {
    const missing = new Set<string>();
    for (const decision of result.trace) {
      if (!(decision.ruleId in RULE_CATALOG)) missing.add(decision.ruleId);
    }
    expect([...missing]).toEqual([]);
  });

  it("every RULE_CATALOG entry has non-empty title/plain/technical/source text", () => {
    for (const [ruleId, entry] of Object.entries(RULE_CATALOG)) {
      expect(entry.title.length, `${ruleId}.title`).toBeGreaterThan(0);
      expect(entry.plain.length, `${ruleId}.plain`).toBeGreaterThan(0);
      expect(entry.technical.length, `${ruleId}.technical`).toBeGreaterThan(0);
      expect(entry.source.length, `${ruleId}.source`).toBeGreaterThan(0);
    }
  });
});
