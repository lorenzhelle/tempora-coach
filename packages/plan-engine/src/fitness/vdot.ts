// VDOT — Jack Daniels' fitness index — and the training paces derived from
// it, via the Daniels-Gilbert (1979) equations. See constants.ts for the
// coefficients and docs/research/designing-a-plan-generator.md §2 for the
// derivation.

import {
  DANIELS_GILBERT_PERCENT_VO2MAX,
  DANIELS_GILBERT_VO2,
  ZONE_PERCENT_BANDS,
} from "../constants";
import type { PaceZones, RaceResult, TrainingZone, ZonePace } from "../types";

/** Oxygen cost (ml/kg/min) of running at `velocityMetersPerMin`, per Daniels & Gilbert (1979). */
export function vo2Cost(velocityMetersPerMin: number): number {
  const { a, b, c } = DANIELS_GILBERT_VO2;
  return a + b * velocityMetersPerMin + c * velocityMetersPerMin ** 2;
}

/** Fraction of VO2max sustainable for a race lasting `durationMinutes`, per Daniels & Gilbert (1979). */
export function percentVo2Max(durationMinutes: number): number {
  const { base, coefA, decayA, coefB, decayB } = DANIELS_GILBERT_PERCENT_VO2MAX;
  return (
    base +
    coefA * Math.exp(decayA * durationMinutes) +
    coefB * Math.exp(decayB * durationMinutes)
  );
}

/** VDOT (Daniels' fitness index) implied by a race or time-trial result. */
export function vdotFromResult(result: RaceResult): number {
  const velocityMetersPerMin =
    result.distanceMeters / (result.timeSeconds / 60);
  const durationMinutes = result.timeSeconds / 60;
  return vo2Cost(velocityMetersPerMin) / percentVo2Max(durationMinutes);
}

/**
 * Inverts the Daniels-Gilbert VO2 equation to find the velocity (m/min)
 * that costs `targetVo2`. Solves c*v^2 + b*v + (a - targetVo2) = 0 for v,
 * taking the positive root — velocity can't be negative.
 */
function velocityFromVo2(targetVo2: number): number {
  const { a, b, c } = DANIELS_GILBERT_VO2;
  const discriminant = b ** 2 - 4 * c * (a - targetVo2);
  return (-b + Math.sqrt(discriminant)) / (2 * c);
}

function paceSecPerKmFromVelocity(velocityMetersPerMin: number): number {
  return 60000 / velocityMetersPerMin;
}

function zonePaceFromVdot(vdot: number, band: [number, number]): ZonePace {
  const [low, high] = band;
  const midPercent = (low + high) / 2;
  return {
    paceSecPerKm: paceSecPerKmFromVelocity(velocityFromVo2(vdot * midPercent)),
    // A higher %VDOT means a faster pace (a lower secPerKm) — the band's
    // low % is therefore the slower pace, and its high % the faster one.
    lowPaceSecPerKm: paceSecPerKmFromVelocity(velocityFromVo2(vdot * low)),
    highPaceSecPerKm: paceSecPerKmFromVelocity(velocityFromVo2(vdot * high)),
  };
}

/** Training paces for all five Daniels zones, derived from a VDOT value. */
export function paceZonesFromVdot(vdot: number): PaceZones {
  const zones = Object.keys(ZONE_PERCENT_BANDS) as TrainingZone[];
  const entries = zones.map(
    (zone) => [zone, zonePaceFromVdot(vdot, ZONE_PERCENT_BANDS[zone])] as const,
  );
  return Object.fromEntries(entries) as PaceZones;
}
