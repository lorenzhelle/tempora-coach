// The other half of "the agent elicits, the engine computes": a pure
// state machine over the onboarding conversation. The agent's only
// intake tool (wired up outside this package) calls evaluateIntake()
// after every answer; its result — not the model's own judgment — decides
// whether enough is known to call generatePlan(). See
// docs/specs/03-onboarding/spec.md and the "Onboarding intake additions"
// this schema encodes.

import { z } from "zod";
import type { GoalInput } from "./types";

export const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export const experienceSchema = z.enum(["beginner", "returner", "continuous"]);
export const scheduleRegularitySchema = z.enum(["regular", "irregular"]);

const raceResultSchema = z.object({
  distanceMeters: z.number().positive(),
  timeSeconds: z.number().positive(),
});

const personalBestSchema = raceResultSchema.extend({
  achievedMonthsAgo: z.number().nonnegative(),
});

const goalInputSchema = z.object({
  distanceMeters: z.number().positive(),
  /** ISO 8601 date. */
  targetDate: z.string(),
  targetTimeSeconds: z.number().positive().optional(),
});

export const intakeProfileSchema = z.object({
  goal: goalInputSchema,
  currentWeeklyVolumeKm: z.number().nonnegative(),
  currentRunsPerWeek: z.number().int().nonnegative(),
  longestRecentRunKm: z.number().nonnegative(),
  availableDaysPerWeek: z.number().int().min(1).max(7),
  longRunDay: dayOfWeekSchema,
  experience: experienceSchema,
  safetyScreenCompleted: z.boolean(),
  personalBest: personalBestSchema.optional(),
  recentTimeTrial: raceResultSchema.optional(),
  gymAccess: z.boolean().optional(),
  priorStressFracture: z.boolean().optional(),
  scheduleRegularity: scheduleRegularitySchema.optional(),
  ageYears: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
});

/** Every top-level field partial, and `goal` itself made partial too — evaluateIntake runs on whatever's been gathered so far, which is usually incomplete. */
export const partialIntakeProfileSchema = intakeProfileSchema.partial().extend({
  goal: goalInputSchema.partial().optional(),
});

export type PartialIntakeProfile = z.infer<typeof partialIntakeProfileSchema>;

/**
 * Every independently-askable field, including nested goal.* fields as
 * dot-paths (matching how Zod reports issue paths for them).
 */
export type IntakeFieldKey =
  | "goal.distanceMeters"
  | "goal.targetDate"
  | "goal.targetTimeSeconds"
  | "currentWeeklyVolumeKm"
  | "currentRunsPerWeek"
  | "longestRecentRunKm"
  | "availableDaysPerWeek"
  | "longRunDay"
  | "experience"
  | "safetyScreenCompleted"
  | "personalBest"
  | "recentTimeTrial"
  | "gymAccess"
  | "priorStressFracture"
  | "scheduleRegularity"
  | "ageYears"
  | "heightCm"
  | "weightKg";

export type IntakeFieldMeta = {
  label: string;
  unit?: string;
  required: boolean;
  whyItMatters: string;
  exampleAnswers: string[];
};

/**
 * Metadata for every field, required and optional. Every optional field
 * has a `whyItMatters` that names a concrete plan consequence — the
 * project's own principle that every question must change the plan, not
 * just be nice to know (age/height/weight are the one deliberate
 * exception: collected for future use, wired to no rule yet, and that's
 * stated plainly here rather than pretending otherwise).
 */
export const INTAKE_FIELDS: Record<IntakeFieldKey, IntakeFieldMeta> = {
  "goal.distanceMeters": {
    label: "Goal race distance",
    unit: "meters",
    required: true,
    whyItMatters:
      "Sets the target paces, the long-run share, and every distance in the plan.",
    exampleAnswers: ["5K", "10K", "half marathon"],
  },
  "goal.targetDate": {
    label: "Goal race date",
    required: true,
    whyItMatters:
      "Sets the plan's horizon (capped at 12 months) and the taper/race-block placement.",
    exampleAnswers: ["in about 6 months", "2027-03-15"],
  },
  "goal.targetTimeSeconds": {
    label: "Goal target time",
    unit: "seconds",
    required: false,
    whyItMatters:
      "Drives the feasibility check and sets the pace for time-trial/race-pace milestones. Without it, the plan still generates, just without a feasibility verdict.",
    exampleAnswers: ["under 20 minutes", "sub-1:45", "just want to finish"],
  },
  currentWeeklyVolumeKm: {
    label: "Current weekly running volume",
    unit: "km",
    required: true,
    whyItMatters: "Sets week 1's volume — the plan never starts above this.",
    exampleAnswers: ["10 km", "about 25km spread over 3 runs"],
  },
  currentRunsPerWeek: {
    label: "Current runs per week",
    required: true,
    whyItMatters: "Baseline for how many running days the plan builds up from.",
    exampleAnswers: ["3", "4-5"],
  },
  longestRecentRunKm: {
    label: "Longest recent single run",
    unit: "km",
    required: true,
    whyItMatters:
      "Seeds the single-session spike ceiling — the most important safety rule in the plan (no session is ever allowed to jump far beyond this).",
    exampleAnswers: ["5 km", "my longest this month was 8km"],
  },
  availableDaysPerWeek: {
    label: "Days per week realistic for training",
    required: true,
    whyItMatters:
      "Clamps how many running/strength sessions the plan actually schedules.",
    exampleAnswers: ["4", "most weekdays, so 5"],
  },
  longRunDay: {
    label: "Preferred long-run day",
    required: true,
    whyItMatters:
      "The algorithm places the long run/time trial there and builds the rest of the week around it.",
    exampleAnswers: ["Sunday", "Saturday mornings work best"],
  },
  experience: {
    label: "Running experience",
    required: true,
    whyItMatters:
      "A returning runner's stale personal best gets a conservative fitness discount; a true beginner's starting paces come from volume instead.",
    exampleAnswers: [
      "never run before",
      "used to run a lot but stopped a while back",
      "training consistently for years",
    ],
  },
  safetyScreenCompleted: {
    label: "Safety screening completed",
    required: true,
    whyItMatters:
      "A brief PAR-Q+-style check for conditions that need medical clearance before starting.",
    exampleAnswers: [
      "yes, no concerns",
      "no chest pain or dizziness during exercise",
    ],
  },
  personalBest: {
    label: "Personal best (distance, time, how long ago)",
    required: false,
    whyItMatters:
      "The primary input for computing a real fitness index (VDOT) — without it, starting paces are estimated conservatively from volume alone.",
    exampleAnswers: ["5K in 21:35, about two years ago"],
  },
  recentTimeTrial: {
    label: "Recent time trial (distance, time)",
    required: false,
    whyItMatters:
      "Preferred over an old personal best for computing fitness — no detraining discount needed for a genuinely recent effort.",
    exampleAnswers: ["ran a 5K time trial last week in 23:10"],
  },
  gymAccess: {
    label: "Gym access",
    required: false,
    whyItMatters:
      "Determines whether strength sessions are a gym circuit or a bodyweight-only routine.",
    exampleAnswers: ["yes", "no, home only"],
  },
  priorStressFracture: {
    label: "Prior stress fracture",
    required: false,
    whyItMatters:
      "Reduces every volume build step by 20% for the whole plan, for extra caution.",
    exampleAnswers: ["yes, a tibial stress fracture a few years ago", "no"],
  },
  scheduleRegularity: {
    label: "Schedule regularity",
    required: false,
    whyItMatters:
      "Doesn't change the generated schedule itself, only how it's framed — a fixed commitment for a regular schedule, a flexible suggestion for an irregular one.",
    exampleAnswers: ["pretty regular", "shift work, varies a lot"],
  },
  ageYears: {
    label: "Age",
    unit: "years",
    required: false,
    whyItMatters:
      "Collected for future injury-risk stratification research — not wired into any rule yet.",
    exampleAnswers: ["34"],
  },
  heightCm: {
    label: "Height",
    unit: "cm",
    required: false,
    whyItMatters:
      "Collected for future injury-risk stratification research — not wired into any rule yet.",
    exampleAnswers: ["178"],
  },
  weightKg: {
    label: "Weight",
    unit: "kg",
    required: false,
    whyItMatters:
      "Collected for future injury-risk stratification research — not wired into any rule yet.",
    exampleAnswers: ["72"],
  },
};

const REQUIRED_FIELDS: IntakeFieldKey[] = (
  Object.keys(INTAKE_FIELDS) as IntakeFieldKey[]
).filter((key) => INTAKE_FIELDS[key].required);

export type IntakeStatus = {
  profile: PartialIntakeProfile;
  /** Required fields not yet provided. */
  missing: IntakeFieldKey[];
  /** Fields provided but failing validation (wrong type/shape). */
  invalid: { field: IntakeFieldKey; message: string }[];
  warnings: string[];
  /** True only when every required field is present and valid — the sole gate generatePlan() should be called behind. */
  canGenerate: boolean;
};

function fieldValue(
  profile: PartialIntakeProfile,
  key: IntakeFieldKey,
): unknown {
  if (key.startsWith("goal.")) {
    const sub = key.slice("goal.".length) as keyof GoalInput;
    return profile.goal?.[sub];
  }
  return (profile as unknown as Record<string, unknown>)[key];
}

/**
 * Validates and summarizes an in-progress intake profile. Pure: `today`
 * is an explicit optional input (only used for the >12-month horizon
 * warning below), never read from the system clock. Called after every
 * answer during onboarding — its `canGenerate` flag, not the model's own
 * judgment, is what gates calling generatePlan().
 */
export function evaluateIntake(
  partial: PartialIntakeProfile,
  today?: string,
): IntakeStatus {
  const parsed = partialIntakeProfileSchema.safeParse(partial);
  const invalid: { field: IntakeFieldKey; message: string }[] = [];
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      invalid.push({
        field: issue.path.join(".") as IntakeFieldKey,
        message: issue.message,
      });
    }
  }
  const profile = parsed.success ? parsed.data : partial;

  const missing = REQUIRED_FIELDS.filter(
    (key) => fieldValue(profile, key) === undefined,
  );

  const warnings: string[] = [];
  if (today && profile.goal?.targetDate) {
    const targetMs = Date.parse(`${profile.goal.targetDate}T00:00:00Z`);
    const todayMs = Date.parse(`${today}T00:00:00Z`);
    const weeksOut = (targetMs - todayMs) / (7 * 86_400_000);
    if (weeksOut > 52) {
      warnings.push(
        `Goal date is ${weeksOut.toFixed(1)} weeks out — beyond the 12-month horizon. Ask for a nearer intermediate goal instead.`,
      );
    }
  }

  return {
    profile,
    missing,
    invalid,
    warnings,
    canGenerate: missing.length === 0 && invalid.length === 0,
  };
}
