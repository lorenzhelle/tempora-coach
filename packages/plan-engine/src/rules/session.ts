// Session-structure rules (pipeline step "session"). Only
// session.interval_structure lands here for now — session.pace_from_zone
// and session.duration_from_distance are simple enough to fold into the
// future week-assembly step (see pipeline/curve.ts's header comment on
// week.ts) rather than needing dedicated rule functions ahead of it.

import { INTERVAL_SESSION } from "../constants";
import { defineRule } from "./define";

export type IntervalSessionStructure = {
  /** The realized total distance of the session (repCount * repDistanceKm) — may exceed the session cap slightly when minRepCount is the binding constraint at low weekly volume. */
  sessionDistanceKm: number;
  repDistanceKm: number;
  repCount: number;
  repDurationSec: number;
  restSec: number;
};

/**
 * Picks a rep distance whose duration, at the given Interval-pace,
 * falls inside Daniels' 3-5 min per-rep band. Prefers the longest "clean"
 * track/road distance that fits (maximizing time-at-VO2max within the
 * bound); if the runner's pace is fast/slow enough that no candidate
 * distance fits inside the band, back-solves the distance for the band's
 * midpoint instead of forcing a non-fitting clean number.
 */
export function pickRepDistanceKm(zonePaceSecPerKm: number): number {
  const [minMin, maxMin] = INTERVAL_SESSION.repDurationMinRange;
  const candidatesInBand = INTERVAL_SESSION.repDistanceCandidatesKm.filter(
    (km) => {
      const durationMin = (km * zonePaceSecPerKm) / 60;
      return durationMin >= minMin && durationMin <= maxMin;
    },
  );
  if (candidatesInBand.length > 0) return Math.max(...candidatesInBand);
  const targetMin = (minMin + maxMin) / 2;
  return (targetMin * 60) / zonePaceSecPerKm;
}

export function intervalSessionStructure(
  zonePaceSecPerKm: number,
  weeklyVolumeKm: number,
): IntervalSessionStructure {
  const sessionCapKm = Math.min(
    INTERVAL_SESSION.maxSessionKm,
    INTERVAL_SESSION.shareOfWeeklyVolume * weeklyVolumeKm,
  );
  const repDistanceKm = pickRepDistanceKm(zonePaceSecPerKm);
  const repCount = Math.max(
    INTERVAL_SESSION.minRepCount,
    Math.floor(sessionCapKm / repDistanceKm),
  );
  const repDurationSec = repDistanceKm * zonePaceSecPerKm;
  const restSec = repDurationSec * INTERVAL_SESSION.restToWorkRatio;
  return {
    sessionDistanceKm: repCount * repDistanceKm,
    repDistanceKm,
    repCount,
    repDurationSec,
    restSec,
  };
}

export const intervalStructureRule = defineRule({
  id: "session.interval_structure",
  step: "session",
  apply({
    zonePaceSecPerKm,
    weeklyVolumeKm,
  }: {
    zonePaceSecPerKm: number;
    weeklyVolumeKm: number;
  }) {
    const value = intervalSessionStructure(zonePaceSecPerKm, weeklyVolumeKm);
    return {
      value,
      inputs: { zonePaceSecPerKm, weeklyVolumeKm },
      outcome: `${value.repCount} x ${(value.repDistanceKm * 1000).toFixed(0)}m @ Interval pace, ${value.restSec.toFixed(0)}s recovery (${value.sessionDistanceKm.toFixed(1)} km total)`,
    };
  },
});
