// Riegel's (1977) race-time-equivalence power law — a simpler, independent
// cross-check on VDOT, and the basis for intermediate milestone targets at
// distances other than the goal race.

import { RIEGEL_EXPONENT } from "../constants";
import type { RaceResult } from "../types";

/**
 * Predicts an equivalent time at `targetDistanceMeters` from a known
 * result, via Riegel's (1977) power law: T2 = T1 * (D2/D1)^exponent.
 */
export function riegelPredict(
  known: RaceResult,
  targetDistanceMeters: number,
  exponent: number = RIEGEL_EXPONENT,
): number {
  return (
    known.timeSeconds *
    (targetDistanceMeters / known.distanceMeters) ** exponent
  );
}
