// Goal, horizon, feasibility, and milestone rules (pipeline step "goal").

import {
  FEASIBILITY_REALISTIC_FRACTION,
  FEASIBILITY_VDOT_BUDGET_PER_MONTH,
  HORIZON_CAP_WEEKS,
  WEEKS_PER_MONTH,
} from "../constants";
import { riegelPredict } from "../fitness/riegel";
import { vdotFromResult } from "../fitness/vdot";
import type { FeasibilityVerdict, RaceResult } from "../types";
import { defineRule } from "./define";

export const horizonCapRule = defineRule({
  id: "goal.horizon_cap_12_months",
  step: "goal",
  apply({ requestedWeeks }: { requestedWeeks: number }) {
    const value = Math.min(requestedWeeks, HORIZON_CAP_WEEKS);
    const clamped = requestedWeeks > HORIZON_CAP_WEEKS;
    return {
      value,
      inputs: { requestedWeeks, capWeeks: HORIZON_CAP_WEEKS },
      outcome: clamped
        ? `Requested ${requestedWeeks.toFixed(1)} weeks exceeds the 12-month cap — clamped to ${value} weeks`
        : `${value} weeks — within the 12-month cap`,
    };
  },
});

export const requiredVdotRule = defineRule({
  id: "goal.required_vdot",
  step: "goal",
  apply({
    distanceMeters,
    targetTimeSeconds,
  }: {
    distanceMeters: number;
    targetTimeSeconds: number;
  }) {
    const value = vdotFromResult({
      distanceMeters,
      timeSeconds: targetTimeSeconds,
    });
    return {
      value,
      inputs: { distanceMeters, targetTimeSeconds },
      outcome: `Goal requires VDOT ${value.toFixed(1)}`,
    };
  },
});

export const feasibilityGapRule = defineRule({
  id: "goal.feasibility_gap",
  step: "goal",
  apply({
    currentVdot,
    requiredVdot,
    horizonWeeks,
  }: {
    currentVdot: number;
    requiredVdot: number;
    horizonWeeks: number;
  }) {
    const gapPoints = requiredVdot - currentVdot;
    const gapPct = gapPoints / currentVdot;
    const monthsAvailable = horizonWeeks / WEEKS_PER_MONTH;
    const budget = monthsAvailable * FEASIBILITY_VDOT_BUDGET_PER_MONTH;
    let verdict: FeasibilityVerdict;
    if (gapPoints <= budget * FEASIBILITY_REALISTIC_FRACTION)
      verdict = "realistic";
    else if (gapPoints <= budget) verdict = "ambitious";
    else verdict = "unrealistic";
    return {
      value: { gapPct, verdict },
      inputs: {
        currentVdot,
        requiredVdot,
        horizonWeeks,
        budgetVdotPoints: budget,
      },
      outcome: `${verdict}: needs +${gapPoints.toFixed(1)} VDOT over ${monthsAvailable.toFixed(1)} months (heuristic budget ~${budget.toFixed(1)} points)`,
    };
  },
});

/**
 * Interpolates intermediate milestone times by scaling the current best
 * result to the goal distance (Riegel), then blending linearly toward the
 * goal's target time across the horizon. Returns null for a milestone
 * whenever there's no current result or no numeric target time to
 * interpolate toward — the milestone still gets a label/date, just no
 * fabricated precision.
 */
export const milestonesFromRiegelRule = defineRule({
  id: "goal.milestones_from_riegel",
  step: "goal",
  apply({
    currentResult,
    goalDistanceMeters,
    goalTargetTimeSeconds,
    milestoneFractions,
  }: {
    currentResult: RaceResult | null;
    goalDistanceMeters: number;
    goalTargetTimeSeconds: number | null;
    milestoneFractions: number[];
  }) {
    const value =
      currentResult && goalTargetTimeSeconds !== null
        ? milestoneFractions.map((fraction) => {
            const currentProjection = riegelPredict(
              currentResult,
              goalDistanceMeters,
            );
            return (
              currentProjection +
              fraction * (goalTargetTimeSeconds - currentProjection)
            );
          })
        : milestoneFractions.map(() => null);
    return {
      value,
      inputs: {
        goalDistanceMeters,
        goalTargetTimeSeconds: goalTargetTimeSeconds ?? -1,
        milestoneCount: milestoneFractions.length,
      },
      outcome:
        currentResult && goalTargetTimeSeconds !== null
          ? `${milestoneFractions.length} intermediate milestone time(s) interpolated via Riegel scaling`
          : "No current result and/or target time to scale from — milestones carry dates only, no target times",
    };
  },
});
