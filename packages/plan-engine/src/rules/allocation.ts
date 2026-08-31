// Weekly-allocation rules (pipeline step "allocation"): how many runs,
// how many of them are quality, the easy/hard split, and strength/
// time-trial placement. See docs/research/progression-und-verletzungspraevention.md
// §A1 (spread volume over more runs) and docs/research/designing-a-plan-generator.md
// (80/20 with a low-frequency fallback).

import {
  EASY_SHARE,
  MAX_QUALITY_SESSIONS_PER_WEEK,
  RUNS_PER_WEEK_BY_VOLUME_KM,
  STRENGTH_SESSIONS_PER_WEEK,
} from "../constants";
import type { Phase } from "../types";
import { lookupAtOrAbove } from "../util/lookup";
import { defineRule } from "./define";

export const runsPerWeekRule = defineRule({
  id: "alloc.runs_per_week",
  step: "allocation",
  apply({
    volumeKm,
    availableDaysPerWeek,
  }: {
    volumeKm: number;
    availableDaysPerWeek: number;
  }) {
    const tierRuns = lookupAtOrAbove(RUNS_PER_WEEK_BY_VOLUME_KM, volumeKm);
    const value = Math.max(1, Math.min(tierRuns, availableDaysPerWeek));
    return {
      value,
      inputs: { volumeKm, availableDaysPerWeek, tierRuns },
      outcome: `${value} run(s)/week (volume tier suggests ${tierRuns}, clamped to ${availableDaysPerWeek} available days)`,
    };
  },
});

export const qualitySessionCountRule = defineRule({
  id: "alloc.max_two_quality",
  step: "allocation",
  apply({ phase, isDeload }: { phase: Phase; isDeload: boolean }) {
    let value = 0;
    if (!isDeload) {
      if (phase === "interval") value = 2;
      else if (phase === "tempo") value = 1;
    }
    value = Math.min(value, MAX_QUALITY_SESSIONS_PER_WEEK);
    return {
      value,
      inputs: { phase, isDeload },
      outcome: isDeload
        ? "Deload week: no separate quality session (the time trial covers it)"
        : `${value} quality session(s) this week`,
    };
  },
});

export const intensitySplitRule = defineRule({
  id: "alloc.intensity_80_20",
  step: "allocation",
  apply({ runsPerWeek }: { runsPerWeek: number }) {
    const value =
      runsPerWeek <= EASY_SHARE.lowDaysThreshold
        ? EASY_SHARE.lowDaysFallback
        : EASY_SHARE.standard;
    return {
      value,
      inputs: { runsPerWeek },
      outcome:
        runsPerWeek <= EASY_SHARE.lowDaysThreshold
          ? `${runsPerWeek} running days/week -> ~60/40 easy/hard fallback split`
          : `${runsPerWeek} running days/week -> 80/20 easy/hard split`,
    };
  },
});

export const strengthSessionsRule = defineRule({
  id: "alloc.strength_two_per_week",
  step: "allocation",
  apply({ nonRunningDaysAvailable }: { nonRunningDaysAvailable: number }) {
    const value = Math.min(STRENGTH_SESSIONS_PER_WEEK, nonRunningDaysAvailable);
    return {
      value,
      inputs: { nonRunningDaysAvailable, target: STRENGTH_SESSIONS_PER_WEEK },
      outcome: `${value} strength session(s) this week`,
    };
  },
});

export const timeTrialCadenceRule = defineRule({
  id: "alloc.time_trial_cadence",
  step: "allocation",
  apply({ isDeload }: { isDeload: boolean }) {
    return {
      value: isDeload,
      inputs: { isDeload },
      outcome: isDeload
        ? "This deload week's long-run slot becomes a time trial instead"
        : "No time trial this week",
    };
  },
});
