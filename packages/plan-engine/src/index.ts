// @tempora/plan-engine — public surface. This is the only file the app (or
// any other consumer) should import from; everything else under src/ is
// implementation detail and may move freely.
//
// See ADR-0009 for why this is a workspace package, and
// docs/research/designing-a-plan-generator.md for the design this
// implements. The full progression/volume/allocation rule set and
// generatePlan() land in a follow-up PR — this ships the fitness index,
// training paces, and the tracing primitive they're built on.

export { riegelPredict } from "./fitness/riegel";
export {
  paceZonesFromVdot,
  percentVo2Max,
  vdotFromResult,
  vo2Cost,
} from "./fitness/vdot";
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
  Decision,
  DecisionScope,
  FitnessConfidence,
  FitnessIndex,
  PaceZones,
  PipelineStep,
  RaceResult,
  RuleId,
  TrainingZone,
  ZonePace,
} from "./types";
