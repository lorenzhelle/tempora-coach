// Long-run sizing and the spike ceiling (pipeline step "longRun") — the
// single most important safety rule in the system. See
// docs/research/progression-und-verletzungspraevention.md §A1 (Frandsen
// et al. 2025 / RUNSAFE): a single session exceeding the 30-day longest
// run predicts overuse injury far better than any weekly-total rule.

import { LONG_RUN_SHARE_CAP, SPIKE_CEILING_MULTIPLIER } from "../constants";
import { defineRule } from "./define";

export const longRunShareCapRule = defineRule({
  id: "longrun.share_cap",
  step: "longRun",
  apply({ weeklyVolumeKm }: { weeklyVolumeKm: number }) {
    const value = weeklyVolumeKm * LONG_RUN_SHARE_CAP;
    return {
      value,
      inputs: { weeklyVolumeKm, shareCap: LONG_RUN_SHARE_CAP },
      outcome: `Long run capped at ${Math.round(LONG_RUN_SHARE_CAP * 100)}% of weekly volume: ${value.toFixed(1)} km`,
    };
  },
});

/**
 * Truncates a candidate session distance to at most 1.10x the longest run
 * of the preceding 30 days. This is the rule that actually enforces
 * safety — it caps the distance, it does not just flag a violation after
 * the fact (check.spike_ceiling in the validators is a redundant,
 * defense-in-depth re-check of the same invariant).
 */
export const spikeCeilingRule = defineRule({
  id: "longrun.spike_ceiling",
  step: "longRun",
  apply({
    candidateKm,
    rollingLongestKm,
  }: {
    candidateKm: number;
    rollingLongestKm: number;
  }) {
    const ceilingKm = rollingLongestKm * SPIKE_CEILING_MULTIPLIER;
    const value = Math.min(candidateKm, ceilingKm);
    const truncated = value < candidateKm - 1e-9;
    return {
      value,
      inputs: { candidateKm, rollingLongestKm, ceilingKm },
      outcome: truncated
        ? `Truncated ${candidateKm.toFixed(1)} km -> ${value.toFixed(1)} km (ceiling: ${Math.round(SPIKE_CEILING_MULTIPLIER * 100)}% of the ${rollingLongestKm.toFixed(1)} km 30-day longest run)`
        : `${value.toFixed(1)} km — within the spike ceiling`,
    };
  },
});
