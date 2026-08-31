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
  | "fitness.detraining_discount"
  | "fitness.baseline_from_volume"
  | "paces.daniels_zones"
  | "fitness.riegel_equivalent"
  | "goal.horizon_cap_12_months"
  | "goal.required_vdot"
  | "goal.feasibility_gap"
  | "goal.milestones_from_riegel"
  | "phase.tempo_gate"
  | "phase.interval_gate"
  | "phase.race_block"
  | "phase.maintenance_mesocycles"
  | "volume.start_from_current"
  | "volume.build_step"
  | "volume.deload_3_1"
  | "volume.post_deload_restart"
  | "volume.target_cap"
  | "volume.conservative_multiplier"
  | "volume.taper"
  | "alloc.runs_per_week"
  | "alloc.intensity_80_20"
  | "alloc.max_two_quality"
  | "alloc.strength_two_per_week"
  | "alloc.time_trial_cadence"
  | "longrun.share_cap"
  | "longrun.spike_ceiling"
  | "days.long_run_on_preferred_day"
  | "days.no_back_to_back_hard"
  | "days.strength_off_quality_days"
  | "days.rest_fills_remainder"
  | "session.pace_from_zone"
  | "session.duration_from_distance"
  | "session.interval_structure"
  | "check.spike_ceiling"
  | "check.easy_share"
  | "check.hard_spacing"
  | "check.deload_cadence"
  | "check.horizon"
  | "check.weekly_sum";

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

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

/**
 * A returner has a training history but has stopped; a beginner has never
 * trained consistently; a continuous runner has been training without a
 * break (their personal best, however old, isn't a detraining signal).
 */
export type Experience = "beginner" | "returner" | "continuous";

export type GoalInput = {
  distanceMeters: number;
  /** ISO 8601 date. */
  targetDate: string;
  /** Absent when the goal is "just finish" / "just improve" rather than a specific time. */
  targetTimeSeconds?: number;
};

export type PersonalBest = RaceResult & {
  achievedMonthsAgo: number;
};

/**
 * Everything evaluateIntake() gathers before generatePlan() can run. See
 * intake.ts (a later addition) for evaluateIntake() itself and the
 * required/optional field metadata.
 */
export type IntakeProfile = {
  goal: GoalInput;
  currentWeeklyVolumeKm: number;
  currentRunsPerWeek: number;
  longestRecentRunKm: number;
  availableDaysPerWeek: number;
  longRunDay: DayOfWeek;
  experience: Experience;
  safetyScreenCompleted: boolean;
  personalBest?: PersonalBest;
  recentTimeTrial?: RaceResult;
  gymAccess?: boolean;
  priorStressFracture?: boolean;
  scheduleRegularity?: "regular" | "irregular";
  ageYears?: number;
  heightCm?: number;
  weightKg?: number;
};

export type PlanInput = IntakeProfile & {
  /** ISO 8601 date the plan's week 1 begins. */
  startDate: string;
  /** ISO 8601 date "today" is — an explicit input, never read from the system clock. */
  today: string;
};

/** Mirrors lib/coaching/plan-schema.ts's trainingPhaseSchema — taper is a volume rule inside 'race', not a fifth value. */
export type Phase = "base" | "tempo" | "interval" | "race";

/** Mirrors lib/coaching/plan-schema.ts's sessionTypeSchema. */
export type SessionType =
  | "easy"
  | "tempo"
  | "interval"
  | "strength"
  | "rest"
  | "timeTrial";

export type PlannedSession = {
  dayOfWeek: DayOfWeek;
  /** ISO 8601 date. */
  date: string;
  type: SessionType;
  distanceKm: number | null;
  durationMin: number | null;
  paceSecPerKm: number | null;
  /** A deterministic, factual summary (e.g. "8.0 km easy @ 5:20/km"). Coaching prose is added later, outside the engine. */
  description: string;
};

export type PlanWeek = {
  weekNumber: number;
  /** ISO 8601 date, the first of this week's 7 days. */
  startDate: string;
  /** ISO 8601 date, the last of this week's 7 days. */
  endDate: string;
  phase: Phase;
  isDeload: boolean;
  isTaper: boolean;
  /** The realized sum of this week's session distances — see check.weekly_sum. */
  targetVolumeKm: number;
  sessions: PlannedSession[];
};

export type Milestone = {
  label: string;
  targetTimeSeconds: number | null;
  /** ISO 8601 date. */
  targetDate: string | null;
};

export type Violation = {
  ruleId: RuleId;
  message: string;
  targetId: string;
};

export type FeasibilityVerdict =
  | "realistic"
  | "ambitious"
  | "unrealistic"
  | "not_applicable";

export type GeneratedPlan = {
  plan: {
    startDate: string;
    targetDate: string;
    goalDescription: string;
    milestones: Milestone[];
    weeks: PlanWeek[];
  };
  fitness: FitnessIndex & { paces: PaceZones };
  feasibility: {
    requiredVdot: number | null;
    gapPct: number | null;
    verdict: FeasibilityVerdict;
  };
  trace: Decision[];
  violations: Violation[];
  ruleSetVersion: string;
};
