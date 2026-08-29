// @tempora/plan-engine — public surface. This is the only file the app (or
// any other consumer) should import from; everything else under src/ is
// implementation detail and may move freely.
//
// See ADR-0009 for why this is a workspace package, and
// docs/research/designing-a-plan-generator.md for the design this
// implements. Fitness math, the tracing primitive, and the rule set land
// incrementally on top of this skeleton.

export const PLAN_ENGINE_VERSION = "0.1.0";
