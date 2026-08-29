// The fitness/paces rules, wrapped for tracing. Each wraps a pure function
// from fitness/*.ts and packages its inputs/outcome for the Decision log —
// the pure functions stay directly unit-testable, these wrappers are what
// the pipeline actually calls.

import { riegelPredict } from "../fitness/riegel";
import { paceZonesFromVdot, vdotFromResult } from "../fitness/vdot";
import type { PaceZones, RaceResult } from "../types";
import { defineRule } from "./define";

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
