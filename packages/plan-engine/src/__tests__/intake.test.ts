import { describe, expect, it } from "vitest";
import { evaluateIntake, INTAKE_FIELDS } from "../intake";

const COMPLETE_REQUIRED = {
  goal: { distanceMeters: 5000, targetDate: "2027-06-01" },
  currentWeeklyVolumeKm: 10,
  currentRunsPerWeek: 3,
  longestRecentRunKm: 5,
  availableDaysPerWeek: 4,
  longRunDay: "sunday" as const,
  experience: "beginner" as const,
  safetyScreenCompleted: true,
};

describe("evaluateIntake", () => {
  it("reports every required field missing for an empty profile, and canGenerate false", () => {
    const status = evaluateIntake({});
    expect(status.canGenerate).toBe(false);
    expect(status.missing).toContain("goal.distanceMeters");
    expect(status.missing).toContain("goal.targetDate");
    expect(status.missing).toContain("longestRecentRunKm");
    expect(status.missing).toContain("safetyScreenCompleted");
    expect(status.missing.length).toBeGreaterThanOrEqual(9);
  });

  it("flips canGenerate true once every required field is present and valid", () => {
    const status = evaluateIntake(COMPLETE_REQUIRED);
    expect(status.missing).toEqual([]);
    expect(status.invalid).toEqual([]);
    expect(status.canGenerate).toBe(true);
  });

  it("never requires an optional field for canGenerate", () => {
    const status = evaluateIntake(COMPLETE_REQUIRED);
    for (const key of [
      "personalBest",
      "recentTimeTrial",
      "gymAccess",
      "priorStressFracture",
      "scheduleRegularity",
      "ageYears",
      "heightCm",
      "weightKg",
    ] as const) {
      expect(status.missing).not.toContain(key);
    }
  });

  it("reports a present-but-invalid field in `invalid`, not `missing`", () => {
    const status = evaluateIntake({
      ...COMPLETE_REQUIRED,
      currentWeeklyVolumeKm: -5,
    });
    expect(status.missing).not.toContain("currentWeeklyVolumeKm");
    expect(
      status.invalid.some((i) => i.field === "currentWeeklyVolumeKm"),
    ).toBe(true);
    expect(status.canGenerate).toBe(false);
  });

  it("reports a partially-filled nested goal field correctly (distance known, date missing)", () => {
    const status = evaluateIntake({
      ...COMPLETE_REQUIRED,
      goal: {
        distanceMeters: 5000,
        targetDate: undefined as unknown as string,
      },
    });
    expect(status.missing).toContain("goal.targetDate");
    expect(status.missing).not.toContain("goal.distanceMeters");
  });

  it("warns when the goal date is beyond the 12-month horizon, given a reference date", () => {
    const status = evaluateIntake(
      {
        ...COMPLETE_REQUIRED,
        goal: { ...COMPLETE_REQUIRED.goal, targetDate: "2028-06-01" },
      },
      "2026-08-29",
    );
    expect(status.warnings.some((w) => w.includes("12-month"))).toBe(true);
  });

  it("does not warn about the horizon when no reference date is given (stays pure — no implicit clock)", () => {
    const status = evaluateIntake({
      ...COMPLETE_REQUIRED,
      goal: { ...COMPLETE_REQUIRED.goal, targetDate: "2030-06-01" },
    });
    expect(status.warnings).toEqual([]);
  });

  it("does not warn when the goal date is within the 12-month horizon", () => {
    const status = evaluateIntake(COMPLETE_REQUIRED, "2026-08-29");
    expect(status.warnings).toEqual([]);
  });
});

describe("INTAKE_FIELDS", () => {
  it("gives every field a non-empty label and whyItMatters", () => {
    for (const [key, meta] of Object.entries(INTAKE_FIELDS)) {
      expect(meta.label.length, `${key}.label`).toBeGreaterThan(0);
      expect(meta.whyItMatters.length, `${key}.whyItMatters`).toBeGreaterThan(
        0,
      );
      expect(
        meta.exampleAnswers.length,
        `${key}.exampleAnswers`,
      ).toBeGreaterThan(0);
    }
  });

  it("marks exactly the 9 core fields required, per docs/specs/03-onboarding/spec.md", () => {
    const required = Object.entries(INTAKE_FIELDS)
      .filter(([, meta]) => meta.required)
      .map(([key]) => key);
    expect(required.sort()).toEqual(
      [
        "goal.distanceMeters",
        "goal.targetDate",
        "currentWeeklyVolumeKm",
        "currentRunsPerWeek",
        "longestRecentRunKm",
        "availableDaysPerWeek",
        "longRunDay",
        "experience",
        "safetyScreenCompleted",
      ].sort(),
    );
  });
});
