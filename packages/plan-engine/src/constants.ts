// Every tunable number in the plan engine, tagged with the ruleId that
// consumes it and (where one exists) its citation. Nothing here is inlined
// into rule logic — changing a number means changing it here, in one place,
// with its source intact. See docs/research/designing-a-plan-generator.md
// and docs/research/progression-und-verletzungspraevention.md for the
// underlying research.

import type { Experience, RuleId, TrainingZone } from "./types";

export const RULE_SOURCES: Record<RuleId, string> = {
  "fitness.vdot_from_result": "Daniels & Gilbert 1979 (Oxygen Power)",
  "fitness.detraining_discount":
    "docs/research/progression-und-verletzungspraevention.md §A2 (detraining timelines)",
  "fitness.baseline_from_volume": "engine heuristic — no direct citation",
  "paces.daniels_zones": "Daniels' Running Formula, 3rd ed. (2014)",
  "fitness.riegel_equivalent": "Riegel 1977, power law T2 = T1*(D2/D1)^1.06",
  "goal.horizon_cap_12_months":
    "docs/specs/02-plan-datenmodell/spec.md, docs/specs/03-onboarding/spec.md (12-month horizon cap)",
  "goal.required_vdot": "Daniels & Gilbert 1979 (Oxygen Power)",
  "goal.feasibility_gap":
    "engine heuristic (~1 VDOT point/month budget) — not a cited figure",
  "goal.milestones_from_riegel": "Riegel 1977, power law T2 = T1*(D2/D1)^1.06",
  "phase.tempo_gate":
    "Ramskov et al. 2018 (JOSPT; Run Clever trial, 8-week preconditioning period before either arm progressed intensity or volume) for the beginner figure; returner/continuous is shortened per the faster cardiovascular/muscular rebuild in progression-und-verletzungspraevention.md §A2. See docs/research/intervalltraining-nach-zieldistanz.md Recommendation (a).",
  "phase.interval_gate":
    "Same basis and gate as phase.tempo_gate — tempo and interval share one base-period gate rather than a separately-timed one; see docs/research/intervalltraining-nach-zieldistanz.md Recommendation (a).",
  "phase.race_block": "engine rule — final weeks before the goal race",
  "phase.maintenance_mesocycles":
    "docs/research/designing-a-plan-generator.md §5 (repeating mesocycles for a long horizon)",
  "volume.start_from_current":
    "engine rule — the plan never starts above current volume",
  "volume.build_step":
    "Buist et al. 2008 (10% rule shows no protective effect); docs/research/progression-und-verletzungspraevention.md §A1",
  "volume.deload_3_1":
    "docs/research/progression-und-verletzungspraevention.md §A3 (3:1 step loading)",
  "volume.post_deload_restart": "derived from the 6-month mileage table",
  "volume.target_cap":
    "docs/research/progression-und-verletzungspraevention.md, 6-month mileage table (month-6 target); the target-by-distance mapping beyond that table is an engine heuristic",
  "volume.conservative_multiplier":
    "docs/research/progression-und-verletzungspraevention.md §A2 (prior injury as an independent risk factor)",
  "volume.taper":
    "Bosquet et al. 2007 (meta-analysis: 2-3 week taper, -41 to -60% volume, hold intensity)",
  "alloc.runs_per_week":
    "docs/research/progression-und-verletzungspraevention.md, 6-month mileage table (runs/week column)",
  "alloc.intensity_80_20":
    "Seiler; docs/research/designing-a-plan-generator.md (80/20, ~60/40 fallback at <=3 days/week)",
  "alloc.max_two_quality":
    "docs/research/designing-a-plan-generator.md (hard/easy spacing)",
  "alloc.strength_two_per_week": "Lauersen, Bertelsen & Andersen 2014 (BJSM)",
  "alloc.time_trial_cadence":
    "docs/research/onboarding-und-trainingsmethodik.md (re-testing every 4-6 weeks)",
  "longrun.share_cap":
    "Daniels' Running Formula (long run <=25-30% of weekly volume)",
  "longrun.spike_ceiling":
    "Frandsen et al. 2025 / RUNSAFE, BJSM (single-session spike vs. 30-day longest run)",
  "days.long_run_on_preferred_day":
    "docs/specs/03-onboarding/spec.md (stated long-run day)",
  "days.no_back_to_back_hard": "engine rule — hard/easy alternation",
  "days.strength_off_quality_days": "engine rule — recovery-day scheduling",
  "days.rest_fills_remainder":
    "FastAsYouCan pattern (explicit key workouts, auto-fill, remainder = rest)",
  "session.pace_from_zone": "Daniels' Running Formula, 3rd ed. (2014)",
  "session.duration_from_distance":
    "engine arithmetic — duration = distance x pace",
  "session.interval_structure":
    "Daniels' Running Formula, 3rd ed. (I-pace: session capped at the lesser of 10 km and 8% of weekly volume; individual reps 3-5 min; recovery ~= work time) — figures corroborated across secondary sources, not verified against the primary text; rep-distance/rep-count derivation is engine synthesis. See docs/research/intervalltraining-nach-zieldistanz.md Block F.",
  "check.spike_ceiling": "Frandsen et al. 2025 / RUNSAFE, BJSM",
  "check.easy_share": "Seiler; the 80/20 principle",
  "check.hard_spacing": "engine rule — hard/easy alternation",
  "check.deload_cadence":
    "docs/research/progression-und-verletzungspraevention.md §A3",
  "check.horizon": "docs/specs/02-plan-datenmodell/spec.md (12-month cap)",
  "check.weekly_sum": "engine internal-consistency check",
};

/**
 * Daniels-Gilbert (1979) oxygen-cost equation coefficients:
 * VO2 = a + b*v + c*v^2, where v is velocity in meters/minute.
 */
export const DANIELS_GILBERT_VO2 = {
  a: -4.6,
  b: 0.182258,
  c: 0.000104,
} as const;

/**
 * Daniels-Gilbert (1979) coefficients for the fraction of VO2max
 * sustainable for a given race duration t (in minutes):
 * %VO2max = base + coefA*e^(decayA*t) + coefB*e^(decayB*t)
 */
export const DANIELS_GILBERT_PERCENT_VO2MAX = {
  base: 0.8,
  coefA: 0.1894393,
  decayA: -0.012778,
  coefB: 0.2989558,
  decayB: -0.1932605,
} as const;

/** Training zones as a [low, high] fraction of VDOT (Daniels 2014). */
export const ZONE_PERCENT_BANDS: Record<TrainingZone, [number, number]> = {
  easy: [0.59, 0.74],
  marathon: [0.75, 0.84],
  threshold: [0.83, 0.88],
  interval: [0.95, 1.0],
  repetition: [1.05, 1.2],
};

/** Riegel (1977) power-law exponent for race-time prediction. */
export const RIEGEL_EXPONENT = 1.06;

/** Average weeks per calendar month (365.25/12/7), used to convert month-granularity intake fields into week-granularity research figures. */
export const WEEKS_PER_MONTH = 4.345;

/**
 * Detraining discount applied to a returner's VDOT when their personal
 * best is stale. Interpolates two data points from the detraining
 * literature (~6% VO2max loss at 4 weeks, ~19% at 9 weeks), extending
 * toward a floor beyond that. Only applied when weeksSincePb crosses
 * `minWeeksToApply` — below that, the PB is treated as still current.
 */
export const DETRAINING_DISCOUNT = {
  minWeeksToApply: 12,
  weeksAt: [4, 9] as const,
  discountAt: [0.06, 0.19] as const,
  maxDiscount: 0.25,
  /** How many additional weeks beyond the 9-week point it takes to reach maxDiscount. */
  weeksToReachFloorPastSecondPoint: 9,
};

/**
 * A conservative fitness estimate for a runner with no qualifying race or
 * time-trial result — an engine heuristic (no direct citation), used only
 * until the first scheduled time trial recalibrates VDOT from a real
 * result (see alloc.time_trial_cadence).
 */
export const BASELINE_VDOT_FROM_VOLUME = {
  intercept: 28,
  perKmPerWeek: 0.35,
  maxCreditedVolumeKm: 60,
  experienceBonus: { beginner: 0, returner: 2, continuous: 4 } as const,
  minVdot: 25,
};

/** The plan never covers more than this many weeks from startDate (see goal.horizon_cap_12_months). */
export const HORIZON_CAP_WEEKS = 52;

/**
 * Feasibility budget: how many VDOT points a runner can realistically gain
 * per month of consistent training. An engine heuristic, not a cited
 * figure — flagged as such wherever the feasibility verdict is surfaced.
 */
export const FEASIBILITY_VDOT_BUDGET_PER_MONTH = 1.0;
/** Below this fraction of the budget, a goal is 'realistic'; up to the full budget, 'ambitious'; beyond it, 'unrealistic'. */
export const FEASIBILITY_REALISTIC_FRACTION = 0.6;

/**
 * Weeks of consistent base training required before quality work (tempo/
 * threshold AND VO2max-interval — a single shared gate, not a separate one
 * per type) unlocks, tiered by experience (see phase.tempo_gate /
 * phase.interval_gate). Not an absolute weekly-volume figure — no RCT ties
 * intensity readiness to a specific km/week number, and a flat number
 * applied regardless of experience (an earlier version of this constant)
 * ignores that beginners carry ~2x the baseline injury risk of experienced
 * runners (Videbaek et al. 2015; Kemler et al. 2018) while returners rebuild
 * cardiovascular/muscular fitness faster (see
 * progression-und-verletzungspraevention.md §A2).
 *
 * The beginner value reuses the Run Clever trial's 8-week preconditioning
 * period directly (Ramskov et al. 2018, JOSPT; Malisoux et al. 2016 trial
 * design) — the one RCT that actually tests readiness-to-progress-intensity,
 * which used an identical 8-week base period before *either* arm (intensity
 * or volume progression) started, not a separate number per workout type.
 * An earlier version of this constant used a coaching-consensus 8-12 week
 * range with a further, uncited 2-week gap between tempo and interval —
 * that gap had no independent evidentiary basis and contradicted the
 * research doc's own real-world cross-check (Nike's beginner-oriented 5K
 * plan introduces multiple quality-work types together from week 1). Once
 * unlocked, intensity is kept safe by the per-session volume/rep caps
 * (INTERVAL_SESSION and the equivalent threshold session cap), not by
 * staggering tempo and interval further apart on the calendar. See
 * docs/research/intervalltraining-nach-zieldistanz.md Recommendation (a).
 */
export const QUALITY_BASE_GATE_WEEKS: Record<Experience, number> = {
  beginner: 8,
  returner: 4,
  continuous: 4,
};
/** The final weeks before targetDate are always the 'race' phase, regardless of volume. */
export const RACE_BLOCK_WEEKS = 4;

/** Weekly-volume build step: larger below the threshold (see docs/research/progression-und-verletzungspraevention.md §A1 — the 10% rule is over-cautious at low mileage). */
export const BUILD_STEP_KM = {
  thresholdKm: 20,
  belowThreshold: 2,
  atOrAboveThreshold: 3,
};
/** Deload volume = this fraction of the preceding build week (within the documented 10-40% reduction band). */
export const DELOAD_FACTOR = 0.8;
/** Taper volume reduction (within Bosquet et al.'s 41-60% band) and how many weeks before targetDate it applies. */
export const TAPER_VOLUME_REDUCTION = 0.5;
export const TAPER_WEEKS = 2;
/** Applied to the build step when priorStressFracture is reported. */
export const CONSERVATIVE_MULTIPLIER = {
  default: 1,
  withPriorStressFracture: 0.8,
};

/**
 * Heuristic target weekly volume by goal distance, piecewise-linearly
 * interpolated. Only the 5K/sub-20 case is directly research-backed (45
 * km/wk, docs/research/progression-und-verletzungspraevention.md's
 * 6-month table); other distances are conventional-wisdom control points,
 * not individually cited.
 */
export const WEEKLY_VOLUME_TARGET_BY_DISTANCE_METERS: ReadonlyArray<
  readonly [number, number]
> = [
  [5000, 45],
  [10000, 55],
  [21097, 65],
  [42195, 80],
];

/** Long run share of weekly volume (Daniels' Running Formula: <=25-30%). */
export const LONG_RUN_SHARE_CAP = 0.3;
/** The single most important safety rule: no session exceeds this multiple of the 30-day rolling longest run (Frandsen et al. 2025 / RUNSAFE). */
export const SPIKE_CEILING_MULTIPLIER = 1.1;
export const SPIKE_LOOKBACK_DAYS = 30;

/** Runs/week by weekly volume, matching the 6-month mileage table's runs/week column (at-or-above breakpoints). */
export const RUNS_PER_WEEK_BY_VOLUME_KM: ReadonlyArray<
  readonly [number, number]
> = [
  [0, 3],
  [15, 4],
  [35, 5],
];
export const MAX_QUALITY_SESSIONS_PER_WEEK = 2;
/** Fraction of weekly volume easy, once quality work exists — the 80/20 principle, falling back to 60/40 at low weekly running-day counts. */
export const EASY_SHARE = {
  standard: 0.8,
  lowDaysFallback: 0.6,
  lowDaysThreshold: 3,
};
export const STRENGTH_SESSIONS_PER_WEEK = 2;

/**
 * Daniels' Running Formula (3rd ed.) I-pace prescription: session volume
 * capped at the lesser of an absolute distance and a fraction of weekly
 * volume; individual reps bounded to 3-5 min (Daniels caps reps here to
 * avoid anaerobic/lactate spillover); recovery close to the work interval's
 * own duration. `repDistanceCandidatesKm` are the "clean" track/road
 * distances the rep-distance calculation picks from. The final session
 * distance is the lesser of this cap and qualitySessionDistanceKm's
 * allocation-consistent amount (see rules/session.ts) — this cap alone
 * isn't allowed to push a week's quality volume outside the 80/20 target.
 * See docs/research/intervalltraining-nach-zieldistanz.md Block F /
 * "Implications for session.interval_structure".
 */
export const INTERVAL_SESSION = {
  shareOfWeeklyVolume: 0.08,
  maxSessionKm: 10,
  repDurationMinRange: [3, 5] as const,
  /** Daniels: recovery is roughly equal to, or slightly less than, work time. */
  restToWorkRatio: 0.9,
  minRepCount: 3,
  repDistanceCandidatesKm: [0.2, 0.4, 0.8, 1.0, 1.2, 1.6],
};

/**
 * Tempo/interval session distance bounds. The share itself isn't a fixed
 * fraction here — it's derived from EASY_SHARE so the two can't drift
 * apart (see qualitySessionDistanceKm in rules/session.ts); these are
 * just sane floor/ceiling clamps on the result.
 */
export const QUALITY_SESSION = { minKm: 3, maxKm: 10 };

/** Bumped whenever a rule's numbers or logic change, so a stored plan's trace can be tied to the rule version that produced it. */
export const RULE_SET_VERSION = "0.1.0";
