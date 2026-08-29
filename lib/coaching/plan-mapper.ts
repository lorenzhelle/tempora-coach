import type { GeneratedPlan } from "@tempora/plan-engine";
import type { PlanProposal } from "./plan-schema";

/**
 * Maps the engine's GeneratedPlan onto the app's Zod-validated
 * PlanProposal shape. Deliberately close to an identity function — see
 * plan-schema.ts's comment — the one real transform is that TrainingWeek's
 * `notes` (LLM-authored phase prose) doesn't exist yet: the engine only
 * produces the deterministic structure, so it's left null here rather
 * than invented. The chat reply, not stored `notes`, carries the coach's
 * commentary for v1 (see docs/specs/03-onboarding/spec.md's "Explaining
 * workouts").
 */
export function mapGeneratedPlanToProposal(
  result: GeneratedPlan,
): PlanProposal {
  return {
    goalDescription: result.plan.goalDescription,
    startDate: result.plan.startDate,
    targetDate: result.plan.targetDate,
    milestones: result.plan.milestones,
    weeks: result.plan.weeks.map((week) => ({
      weekNumber: week.weekNumber,
      startDate: week.startDate,
      endDate: week.endDate,
      phase: week.phase,
      isDeload: week.isDeload,
      isTaper: week.isTaper,
      targetVolumeKm: week.targetVolumeKm,
      notes: null,
      sessions: week.sessions.map((session) => ({
        dayOfWeek: session.dayOfWeek,
        date: session.date,
        type: session.type,
        targetDurationMin: session.durationMin,
        targetDistanceKm: session.distanceKm,
        targetPaceSecPerKm: session.paceSecPerKm,
        description: session.description,
      })),
    })),
    fitness: result.fitness,
    feasibility: result.feasibility,
    trace: result.trace,
    violations: result.violations,
    ruleSetVersion: result.ruleSetVersion,
  };
}
