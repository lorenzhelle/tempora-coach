// @tempora/plan-engine — public surface. This is the only file the app (or
// any other consumer) should import from; everything else under src/ is
// implementation detail and may move freely.
//
// See ADR-0009 for why this is a workspace package, and
// docs/research/designing-a-plan-generator.md for the design this
// implements. evaluateIntake() — the other half of "the agent elicits, the
// engine computes" — lands in a follow-up PR; generatePlan() here already
// assumes a complete IntakeProfile.

export { riegelPredict } from "./fitness/riegel";
export {
  paceZonesFromVdot,
  percentVo2Max,
  vdotFromResult,
  vo2Cost,
} from "./fitness/vdot";
export { generatePlan } from "./pipeline/index";
export type { CatalogEntry } from "./rules/catalog";
export { RULE_CATALOG } from "./rules/catalog";
export type { RuleDefinition, RuleResult, TraceTarget } from "./rules/define";
export { defineRule, Tracer } from "./rules/define";
export {
  danielsZonesRule,
  riegelEquivalentRule,
  vdotFromResultRule,
} from "./rules/fitness";
export type {
  DayOfWeek,
  Decision,
  DecisionScope,
  Experience,
  FeasibilityVerdict,
  FitnessConfidence,
  FitnessIndex,
  GeneratedPlan,
  GoalInput,
  IntakeProfile,
  Milestone,
  PaceZones,
  PersonalBest,
  Phase,
  PipelineStep,
  PlanInput,
  PlannedSession,
  PlanWeek,
  RaceResult,
  RuleId,
  SessionType,
  TrainingZone,
  Violation,
  ZonePace,
} from "./types";
