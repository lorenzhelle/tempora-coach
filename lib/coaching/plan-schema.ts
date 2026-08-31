import { z } from "zod";

// Structured plan shape for the onboarding chat's `generatePlan` tool
// (docs/specs/03-onboarding/spec.md). Mirrors packages/plan-engine's
// GeneratedPlan output field-for-field (see lib/coaching/plan-mapper.ts)
// and the Spec 2 data model (docs/specs/02-plan-datenmodell/spec.md)
// minus DB ids/relations, since this ships before ticket C3 (DB
// persistence) exists. Full horizon, every week at full detail — not a
// week1-only shape (see ADR-0009 / former ADR-0008).

export const trainingPhaseSchema = z.enum([
  "base",
  "tempo",
  "interval",
  "race",
]);

export const dayOfWeekSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

export const sessionTypeSchema = z.enum([
  "easy",
  "tempo",
  "interval",
  "strength",
  "rest",
  "timeTrial",
]);

export const plannedSessionSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  date: z.string().describe("ISO 8601 date"),
  type: sessionTypeSchema,
  targetDurationMin: z.number().positive().nullable(),
  targetDistanceKm: z.number().positive().nullable(),
  // A number, never a pre-formatted string like '5:30/km' — formatting
  // is a render-time concern (see formatPace in plan-mapper.ts), not
  // something baked into stored/transmitted data.
  targetPaceSecPerKm: z.number().positive().nullable(),
  description: z.string(),
});

export const trainingWeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  startDate: z.string().describe("ISO 8601 date"),
  endDate: z.string().describe("ISO 8601 date"),
  phase: trainingPhaseSchema,
  isDeload: z.boolean(),
  isTaper: z.boolean(),
  targetVolumeKm: z.number().nonnegative(),
  notes: z.string().nullable(),
  sessions: z.array(plannedSessionSchema).length(7),
});

export const milestoneSchema = z.object({
  label: z.string().describe("e.g. 'Checkpoint (week 13)' or 'Goal'"),
  targetTimeSeconds: z.number().positive().nullable(),
  targetDate: z.string().nullable().describe("ISO 8601 date, e.g. 2026-12-01"),
});

const zonePaceSchema = z.object({
  paceSecPerKm: z.number(),
  lowPaceSecPerKm: z.number(),
  highPaceSecPerKm: z.number(),
});

export const paceZonesSchema = z.object({
  easy: zonePaceSchema,
  marathon: zonePaceSchema,
  threshold: zonePaceSchema,
  interval: zonePaceSchema,
  repetition: zonePaceSchema,
});

export const fitnessIndexSchema = z.object({
  vdot: z.number(),
  confidence: z.enum(["high", "medium", "low"]),
  paces: paceZonesSchema,
});

export const feasibilitySchema = z.object({
  requiredVdot: z.number().nullable(),
  gapPct: z.number().nullable(),
  verdict: z.enum(["realistic", "ambitious", "unrealistic", "not_applicable"]),
});

// The transparency trace (docs/specs/03-onboarding/spec.md "The 'why'
// reveal") — packages/plan-engine's Decision type, verbatim. `value` is
// deliberately untyped: it varies by rule (a number, a PaceZones object,
// a day list, ...) and the UI only ever displays `outcome`/`inputs`, not
// `value` directly.
export const decisionSchema = z.object({
  step: z.string(),
  scope: z.enum(["plan", "phase", "week", "session"]),
  targetId: z.string(),
  ruleId: z.string(),
  inputs: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
  outcome: z.string(),
  value: z.unknown(),
});

export const violationSchema = z.object({
  ruleId: z.string(),
  message: z.string(),
  targetId: z.string(),
});

export const planProposalSchema = z.object({
  goalDescription: z.string().describe("e.g. '5K under 20:00'"),
  startDate: z.string().describe("ISO 8601 date"),
  targetDate: z.string().describe("ISO 8601 date"),
  milestones: z.array(milestoneSchema).min(1),
  weeks: z
    .array(trainingWeekSchema)
    .min(1)
    .describe("the full horizon, every week at full day-by-day detail"),
  fitness: fitnessIndexSchema,
  feasibility: feasibilitySchema,
  trace: z.array(decisionSchema),
  violations: z.array(violationSchema),
  ruleSetVersion: z.string(),
});

export type PlanProposal = z.infer<typeof planProposalSchema>;

export const quickRepliesSchema = z.object({
  options: z.array(z.string()).min(2).max(6),
});

export type QuickReplies = z.infer<typeof quickRepliesSchema>;
