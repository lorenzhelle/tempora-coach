// The fitness/paces rules, wrapped for tracing. Each wraps a pure function
// from fitness/*.ts and packages its inputs/outcome for the Decision log —
// the pure functions stay directly unit-testable, these wrappers are what
// the pipeline actually calls.

import { BASELINE_VDOT_FROM_VOLUME, DETRAINING_DISCOUNT } from "../constants";
import { riegelPredict } from "../fitness/riegel";
import { paceZonesFromVdot, vdotFromResult } from "../fitness/vdot";
import type { Experience, PaceZones, RaceResult } from "../types";
import { defineRule } from "./define";

/**
 * Fraction to discount a stale personal best's VDOT by. Interpolates two
 * research-cited data points (4 weeks ~6%, 9 weeks ~19%) and extends
 * toward a 25% floor. Only meaningful for weeksSincePb >= 12 — see
 * detrainingDiscountRule, which gates on that threshold before calling
 * this — so in practice this always evaluates in the "beyond the second
 * point, extending toward the floor" branch; the earlier branches exist
 * for a complete curve shape, not because they're reachable today. Note
 * this produces a step discontinuity right at the 12-week gate (0% just
 * below it, ~21% just above) — an accepted simplification for a first
 * version, not a claim that detraining itself is discontinuous.
 */
export function detrainingDiscountFraction(weeksSincePb: number): number {
  const {
    minWeeksToApply,
    weeksAt,
    discountAt,
    maxDiscount,
    weeksToReachFloorPastSecondPoint,
  } = DETRAINING_DISCOUNT;
  if (weeksSincePb < minWeeksToApply) return 0;
  const [w1, w2] = weeksAt;
  const [d1, d2] = discountAt;
  if (weeksSincePb <= w1) return (weeksSincePb / w1) * d1;
  if (weeksSincePb <= w2)
    return d1 + ((weeksSincePb - w1) / (w2 - w1)) * (d2 - d1);
  const floorWeek = w2 + weeksToReachFloorPastSecondPoint;
  if (weeksSincePb >= floorWeek) return maxDiscount;
  return d2 + ((weeksSincePb - w2) / (floorWeek - w2)) * (maxDiscount - d2);
}

export const vdotFromResultRule = defineRule({
  id: "fitness.vdot_from_result",
  step: "fitness",
  apply(result: RaceResult) {
    const vdot = vdotFromResult(result);
    return {
      value: vdot,
      inputs: {
        distanceMeters: result.distanceMeters,
        timeSeconds: result.timeSeconds,
      },
      outcome: `VDOT ${vdot.toFixed(1)} from ${result.distanceMeters}m in ${result.timeSeconds}s`,
    };
  },
});

export const danielsZonesRule = defineRule({
  id: "paces.daniels_zones",
  step: "paces",
  apply({ vdot }: { vdot: number }) {
    const zones: PaceZones = paceZonesFromVdot(vdot);
    return {
      value: zones,
      inputs: { vdot },
      outcome: `Training paces derived from VDOT ${vdot.toFixed(1)}`,
    };
  },
});

export const detrainingDiscountRule = defineRule({
  id: "fitness.detraining_discount",
  step: "fitness",
  apply({ rawVdot, weeksSincePb }: { rawVdot: number; weeksSincePb: number }) {
    const discount = detrainingDiscountFraction(weeksSincePb);
    const value = rawVdot * (1 - discount);
    return {
      value,
      inputs: { rawVdot, weeksSincePb, discountFraction: discount },
      outcome: `VDOT ${rawVdot.toFixed(1)} discounted ${Math.round(discount * 100)}% for ${weeksSincePb.toFixed(0)} weeks since PB -> ${value.toFixed(1)}`,
    };
  },
});

export const baselineVdotFromVolumeRule = defineRule({
  id: "fitness.baseline_from_volume",
  step: "fitness",
  apply({
    currentWeeklyVolumeKm,
    experience,
  }: {
    currentWeeklyVolumeKm: number;
    experience: Experience;
  }) {
    const {
      intercept,
      perKmPerWeek,
      maxCreditedVolumeKm,
      experienceBonus,
      minVdot,
    } = BASELINE_VDOT_FROM_VOLUME;
    const creditedVolumeKm = Math.min(
      currentWeeklyVolumeKm,
      maxCreditedVolumeKm,
    );
    const value = Math.max(
      minVdot,
      intercept + perKmPerWeek * creditedVolumeKm + experienceBonus[experience],
    );
    return {
      value,
      inputs: { currentWeeklyVolumeKm, experience },
      outcome: `No qualifying result available — conservative baseline VDOT ${value.toFixed(1)} from ${currentWeeklyVolumeKm.toFixed(1)} km/wk (${experience}); confidence low until a time trial`,
    };
  },
});

export const riegelEquivalentRule = defineRule({
  id: "fitness.riegel_equivalent",
  step: "fitness",
  apply({
    known,
    targetDistanceMeters,
  }: {
    known: RaceResult;
    targetDistanceMeters: number;
  }) {
    const seconds = riegelPredict(known, targetDistanceMeters);
    return {
      value: seconds,
      inputs: {
        knownDistanceMeters: known.distanceMeters,
        knownTimeSeconds: known.timeSeconds,
        targetDistanceMeters,
      },
      outcome: `${targetDistanceMeters}m equivalent: ${Math.round(seconds)}s`,
    };
  },
});
