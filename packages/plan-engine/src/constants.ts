// Every tunable number in the plan engine, tagged with the ruleId that
// consumes it and (where one exists) its citation. Nothing here is inlined
// into rule logic — changing a number means changing it here, in one place,
// with its source intact. See docs/research/designing-a-plan-generator.md
// and docs/research/progression-und-verletzungspraevention.md for the
// underlying research.

import type { RuleId, TrainingZone } from "./types";

export const RULE_SOURCES: Record<RuleId, string> = {
  "fitness.vdot_from_result": "Daniels & Gilbert 1979 (Oxygen Power)",
  "paces.daniels_zones": "Daniels' Running Formula, 3rd ed. (2014)",
  "fitness.riegel_equivalent": "Riegel 1977, power law T2 = T1*(D2/D1)^1.06",
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
