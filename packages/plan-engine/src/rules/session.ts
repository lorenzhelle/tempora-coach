// Per-session prescription rules (pipeline step "session"): pace,
// duration, and (for interval sessions) a Daniels-grounded rep/rest
// structure. See Daniels' Running Formula for the pace-per-zone mapping
// and docs/research/intervalltraining-nach-zieldistanz.md Block F for the
// interval-structure derivation.

import { INTERVAL_SESSION, QUALITY_SESSION } from "../constants";
import type { PaceZones, SessionType } from "../types";
import { defineRule } from "./define";

function zoneForSessionType(type: SessionType): keyof PaceZones | null {
  if (type === "easy") return "easy";
  if (type === "tempo") return "threshold";
  if (type === "interval") return "interval";
  return null;
}

export const paceFromZoneRule = defineRule({
  id: "session.pace_from_zone",
  step: "session",
  apply({
    type,
    paces,
    goalPaceSecPerKm,
  }: {
    type: SessionType;
    paces: PaceZones;
    goalPaceSecPerKm: number | null;
  }) {
    const zone = zoneForSessionType(type);
    const value = zone
      ? paces[zone].paceSecPerKm
      : type === "timeTrial"
        ? goalPaceSecPerKm
        : null;
    return {
      value,
      inputs: { type, zone: zone ?? "none" },
      outcome:
        value !== null
          ? `${type} -> ${value.toFixed(0)} s/km`
          : `${type} — no fixed pace`,
    };
  },
});

export const durationFromDistanceRule = defineRule({
  id: "session.duration_from_distance",
  step: "session",
  apply({
    distanceKm,
    paceSecPerKm,
  }: {
    distanceKm: number;
    paceSecPerKm: number;
  }) {
    const value = (distanceKm * paceSecPerKm) / 60;
    return {
      value,
      inputs: { distanceKm, paceSecPerKm },
      outcome: `${distanceKm.toFixed(1)} km @ ${paceSecPerKm.toFixed(0)} s/km -> ${value.toFixed(0)} min`,
    };
  },
});

/**
 * Quality-session distance, clamped to a sane range. Derived from
 * alloc.intensity_80_20's easy-share fraction (not an independent
 * constant) so the two rules can't drift apart: total quality volume is
 * exactly `weeklyVolumeKm * (1 - easyShareFraction)`, split evenly across
 * qualityCount sessions. An earlier version sized each quality session at
 * a fixed 15% of weekly volume independent of easyShareFraction — with 2
 * quality sessions that summed to 30% quality / 70% easy, silently
 * violating the 80/20 target it was supposed to sit inside (caught via
 * check.easy_share firing on every interval-phase week during manual
 * verification, not by construction — hence deriving it now instead).
 * This is tempo's actual session distance; for interval sessions it's one
 * of two independent ceilings fed into intervalSessionStructure below
 * (Daniels' own I-pace cap is the other — the smaller of the two wins, so
 * neither can push a week's quality volume outside the 80/20 target on
 * its own).
 */
export function qualitySessionDistanceKm(
  weeklyVolumeKm: number,
  qualityCount: number,
  easyShareFraction: number,
): number {
  if (qualityCount <= 0) return 0;
  const totalQualityKm = weeklyVolumeKm * (1 - easyShareFraction);
  const perSessionKm = totalQualityKm / qualityCount;
  return Math.min(
    QUALITY_SESSION.maxKm,
    Math.max(QUALITY_SESSION.minKm, perSessionKm),
  );
}

export type IntervalSessionStructure = {
  /** The realized total distance of the session (repCount * repDistanceKm) — may exceed the target slightly when minRepCount is the binding constraint at low weekly volume. */
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

/**
 * Combines two independent ceilings into the interval session's actual
 * target distance before structuring it into reps: Daniels' own I-pace cap
 * (lesser of 10 km and 8% of weekly volume) and qualitySessionDistanceKm's
 * allocation-consistency ceiling (keeps the week's total quality volume
 * inside the 80/20 target — see that function's doc comment for the bug
 * this guards against). Neither ceiling is allowed to override the other;
 * the smaller one wins.
 */
export function intervalSessionStructure(
  zonePaceSecPerKm: number,
  weeklyVolumeKm: number,
  qualityCount: number,
  easyShareFraction: number,
): IntervalSessionStructure {
  const danielsCapKm = Math.min(
    INTERVAL_SESSION.maxSessionKm,
    INTERVAL_SESSION.shareOfWeeklyVolume * weeklyVolumeKm,
  );
  const allocationCapKm = qualitySessionDistanceKm(
    weeklyVolumeKm,
    qualityCount,
    easyShareFraction,
  );
  const targetKm = Math.min(danielsCapKm, allocationCapKm);
  const repDistanceKm = pickRepDistanceKm(zonePaceSecPerKm);
  const repCount = Math.max(
    INTERVAL_SESSION.minRepCount,
    Math.floor(targetKm / repDistanceKm),
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
    qualityCount,
    easyShareFraction,
  }: {
    zonePaceSecPerKm: number;
    weeklyVolumeKm: number;
    qualityCount: number;
    easyShareFraction: number;
  }) {
    const structure = intervalSessionStructure(
      zonePaceSecPerKm,
      weeklyVolumeKm,
      qualityCount,
      easyShareFraction,
    );
    return {
      value: structure.sessionDistanceKm,
      inputs: {
        zonePaceSecPerKm,
        weeklyVolumeKm,
        qualityCount,
        easyShareFraction,
        repCount: structure.repCount,
        repDistanceKm: structure.repDistanceKm,
        restSec: Math.round(structure.restSec),
      },
      outcome: `${structure.repCount} x ${(structure.repDistanceKm * 1000).toFixed(0)}m @ Interval pace, ${structure.restSec.toFixed(0)}s recovery (${structure.sessionDistanceKm.toFixed(1)} km total)`,
    };
  },
});
