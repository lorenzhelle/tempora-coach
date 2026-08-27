import { z } from "zod";

// Structured plan proposal for the onboarding chat's `proposePlan` tool
// (docs/specs/03-onboarding/spec.md). Mirrors the Spec 2 data model
// (docs/specs/02-plan-datenmodell/spec.md) minus DB ids/relations, since
// this ships before ticket C3 (DB persistence) exists.

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
  type: sessionTypeSchema,
  targetDurationMin: z.number().positive().nullable(),
  targetDistanceKm: z.number().positive().nullable(),
  targetPace: z
    .string()
    .nullable()
    .describe("e.g. '5:30/km', null if not paced"),
  description: z.string(),
});

export const milestoneSchema = z.object({
  label: z.string().describe("e.g. 'under 25 min'"),
  targetTimeSeconds: z.number().positive().nullable(),
  targetDate: z.string().nullable().describe("ISO 8601 date, e.g. 2026-12-01"),
});

export const phaseOverviewSchema = z.object({
  phase: trainingPhaseSchema,
  weekCount: z.number().int().positive(),
  focus: z.string().describe("one short phrase, e.g. 'aerobic base'"),
});

export const planProposalSchema = z.object({
  goalDescription: z.string().describe("e.g. '5 km under 20 minutes'"),
  startDate: z.string().describe("ISO 8601 date"),
  targetDate: z.string().describe("ISO 8601 date"),
  milestones: z.array(milestoneSchema).min(1),
  phases: z
    .array(phaseOverviewSchema)
    .min(1)
    .describe("phase overview, roughly sketched"),
  week1: z.object({
    weekNumber: z.literal(1),
    phase: trainingPhaseSchema,
    notes: z.string().nullable(),
    sessions: z
      .array(plannedSessionSchema)
      .min(1)
      .describe("one entry per day, including rest days"),
  }),
});

export type PlanProposal = z.infer<typeof planProposalSchema>;

export const quickRepliesSchema = z.object({
  options: z.array(z.string()).min(2).max(6),
});

export type QuickReplies = z.infer<typeof quickRepliesSchema>;
