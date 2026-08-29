// Public types shared across the plan engine. Units are km and seconds
// throughout; a pace is stored as secPerKm (a number), never as a
// formatted string — 'mm:ss/km' display formatting is an app-layer
// concern, not the engine's (see the plan-engine package doc comment).

/**
 * Identifies which rule produced a Decision. Extended incrementally as more
 * of the pipeline lands — see docs/research/designing-a-plan-generator.md
 * for the full rule set this will eventually cover.
 */
export type RuleId =
  | "fitness.vdot_from_result"
  | "paces.daniels_zones"
  | "fitness.riegel_equivalent";

/** The pipeline stage a rule belongs to. Mirrors the UI's "why" reveal, which groups the trace by step. */
export type PipelineStep =
  | "fitness"
  | "paces"
  | "goal"
  | "phases"
  | "volume"
  | "allocation"
  | "longRun"
  | "placement"
  | "session"
  | "validate";

export type DecisionScope = "plan" | "phase" | "week" | "session";

/**
 * A single fired rule, as recorded by the Tracer. This is the transparency
 * primitive: the UI renders these grouped by `step`, and the coaching agent
 * explains the stored trace rather than inventing a rationale.
 */
export type Decision = {
  step: PipelineStep;
  scope: DecisionScope;
  /** e.g. 'plan', 'week-7', 'week-7:tuesday' */
  targetId: string;
  ruleId: RuleId;
  inputs: Record<string, number | string | boolean>;
  outcome: string;
  value: unknown;
};

export type FitnessConfidence = "high" | "medium" | "low";

export type RaceResult = {
  distanceMeters: number;
  timeSeconds: number;
};

/** Daniels' five training-intensity zones. */
export type TrainingZone =
  | "easy"
  | "marathon"
  | "threshold"
  | "interval"
  | "repetition";

export type ZonePace = {
  /** Representative prescribed pace for this zone, in seconds per km (the zone band's midpoint). */
  paceSecPerKm: number;
  /** Slower end of the zone's %VDOT band, in seconds per km (>= paceSecPerKm). */
  lowPaceSecPerKm: number;
  /** Faster end of the zone's %VDOT band, in seconds per km (<= paceSecPerKm). */
  highPaceSecPerKm: number;
};

export type PaceZones = Record<TrainingZone, ZonePace>;

export type FitnessIndex = {
  vdot: number;
  confidence: FitnessConfidence;
};
