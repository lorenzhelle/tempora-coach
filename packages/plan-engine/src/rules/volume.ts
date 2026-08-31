// Weekly-volume rules (pipeline step "volume") — the regression-tested
// core of the engine. See docs/research/progression-und-verletzungspraevention.md
// §A1/§A3 for the underlying evidence and the 6-month mileage table this
// reproduces (packages/plan-engine/src/__tests__/volume-curve.test.ts).

import {
  BUILD_STEP_KM,
  CONSERVATIVE_MULTIPLIER,
  DELOAD_FACTOR,
  TAPER_VOLUME_REDUCTION,
  WEEKLY_VOLUME_TARGET_BY_DISTANCE_METERS,
} from "../constants";
import { interpolatePiecewiseLinear } from "../util/lookup";
import { defineRule } from "./define";

/** The absolute km step for the next build week, given the volume it's building from. */
export function buildStepKm(
  previousKm: number,
  conservativeMultiplier: number,
): number {
  const baseStep =
    previousKm < BUILD_STEP_KM.thresholdKm
      ? BUILD_STEP_KM.belowThreshold
      : BUILD_STEP_KM.atOrAboveThreshold;
  return baseStep * conservativeMultiplier;
}

export const volumeStartRule = defineRule({
  id: "volume.start_from_current",
  step: "volume",
  apply({ currentWeeklyVolumeKm }: { currentWeeklyVolumeKm: number }) {
    return {
      value: currentWeeklyVolumeKm,
      inputs: { currentWeeklyVolumeKm },
      outcome: `Week 1 starts at your current volume: ${currentWeeklyVolumeKm.toFixed(1)} km`,
    };
  },
});

export const volumeBuildStepRule = defineRule({
  id: "volume.build_step",
  step: "volume",
  apply({
    previousKm,
    conservativeMultiplier,
    targetKm,
  }: {
    previousKm: number;
    conservativeMultiplier: number;
    targetKm: number;
  }) {
    const stepKm = buildStepKm(previousKm, conservativeMultiplier);
    const value = Math.min(previousKm + stepKm, targetKm);
    return {
      value,
      inputs: { previousKm, stepKm, conservativeMultiplier },
      outcome: `${previousKm.toFixed(1)} -> ${value.toFixed(1)} km`,
    };
  },
});

export const volumePostDeloadRestartRule = defineRule({
  id: "volume.post_deload_restart",
  step: "volume",
  apply({
    preDeloadPeakKm,
    conservativeMultiplier,
    targetKm,
  }: {
    preDeloadPeakKm: number;
    conservativeMultiplier: number;
    targetKm: number;
  }) {
    const stepKm = buildStepKm(preDeloadPeakKm, conservativeMultiplier);
    const value = Math.min(preDeloadPeakKm + stepKm, targetKm);
    return {
      value,
      inputs: { preDeloadPeakKm, stepKm, conservativeMultiplier },
      outcome: `Resuming from the pre-deload peak (${preDeloadPeakKm.toFixed(1)} km): ${value.toFixed(1)} km`,
    };
  },
});

export const volumeDeloadRule = defineRule({
  id: "volume.deload_3_1",
  step: "volume",
  apply({ previousBuildKm }: { previousBuildKm: number }) {
    const value = previousBuildKm * DELOAD_FACTOR;
    return {
      value,
      inputs: { previousBuildKm, deloadFactor: DELOAD_FACTOR },
      outcome: `Deload week: ${value.toFixed(1)} km (${Math.round(DELOAD_FACTOR * 100)}% of ${previousBuildKm.toFixed(1)} km)`,
    };
  },
});

export const volumeTaperRule = defineRule({
  id: "volume.taper",
  step: "volume",
  apply({
    preTaperKm,
    weeksFromRace,
  }: {
    preTaperKm: number;
    weeksFromRace: number;
  }) {
    const value = preTaperKm * (1 - TAPER_VOLUME_REDUCTION);
    return {
      value,
      inputs: {
        preTaperKm,
        weeksFromRace,
        reductionFraction: TAPER_VOLUME_REDUCTION,
      },
      outcome: `Taper (${weeksFromRace} week(s) out): ${value.toFixed(1)} km (${Math.round(TAPER_VOLUME_REDUCTION * 100)}% cut; session count and intensity held)`,
    };
  },
});

function targetVolumeForDistance(goalDistanceMeters: number): number {
  return interpolatePiecewiseLinear(
    WEEKLY_VOLUME_TARGET_BY_DISTANCE_METERS,
    goalDistanceMeters,
  );
}

export const volumeTargetCapRule = defineRule({
  id: "volume.target_cap",
  step: "volume",
  apply({
    goalDistanceMeters,
    currentWeeklyVolumeKm,
  }: {
    goalDistanceMeters: number;
    currentWeeklyVolumeKm: number;
  }) {
    const heuristicTargetKm = targetVolumeForDistance(goalDistanceMeters);
    // Never ask an already-advanced runner to cut volume just to fit the heuristic.
    const value = Math.max(heuristicTargetKm, currentWeeklyVolumeKm);
    return {
      value,
      inputs: { goalDistanceMeters, heuristicTargetKm, currentWeeklyVolumeKm },
      outcome: `Target weekly volume: ${value.toFixed(1)} km`,
    };
  },
});

export const volumeConservativeMultiplierRule = defineRule({
  id: "volume.conservative_multiplier",
  step: "volume",
  apply({ priorStressFracture }: { priorStressFracture: boolean }) {
    const value = priorStressFracture
      ? CONSERVATIVE_MULTIPLIER.withPriorStressFracture
      : CONSERVATIVE_MULTIPLIER.default;
    return {
      value,
      inputs: { priorStressFracture },
      outcome: priorStressFracture
        ? "Prior stress fracture reported: build steps reduced 20% for extra caution"
        : "No prior stress fracture reported: standard build steps",
    };
  },
});
