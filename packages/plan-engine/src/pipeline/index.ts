// generatePlan(): the engine's one entry point. Orchestrates the curve
// (steps 1-5), per-week session generation (steps 6-9), and validation
// (step 10) — no logic of its own beyond wiring those together and
// threading the rolling spike-ceiling history across weeks in date order.

import { RULE_SET_VERSION } from "../constants";
import { Tracer } from "../rules/define";
import type { GeneratedPlan, GoalInput, PlanInput, PlanWeek } from "../types";
import { addDays } from "../util/dates";
import { buildCurve } from "./curve";
import { validatePlan } from "./validate";
import type { RunHistoryEntry } from "./week";
import { buildWeekSessions } from "./week";

const DISTANCE_LABELS: ReadonlyArray<readonly [number, string]> = [
  [5000, "5K"],
  [10000, "10K"],
  [21097, "Half Marathon"],
  [42195, "Marathon"],
];

function distanceLabel(distanceMeters: number): string {
  const exact = DISTANCE_LABELS.find(([meters]) => meters === distanceMeters);
  if (exact) return exact[1];
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

function formatMinutesSeconds(totalSeconds: number): string {
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** A deterministic default label (e.g. "5K under 20:00") — coaching prose replacing/extending this happens outside the engine. */
function formatGoalDescription(goal: GoalInput): string {
  const label = distanceLabel(goal.distanceMeters);
  return goal.targetTimeSeconds !== undefined
    ? `${label} under ${formatMinutesSeconds(goal.targetTimeSeconds)}`
    : label;
}

export function generatePlan(input: PlanInput): GeneratedPlan {
  const tracer = new Tracer();
  const curve = buildCurve(input, tracer);

  const goalPaceSecPerKm =
    input.goal.targetTimeSeconds !== undefined
      ? input.goal.targetTimeSeconds / (input.goal.distanceMeters / 1000)
      : null;

  const history: RunHistoryEntry[] = [
    {
      date: addDays(input.startDate, -1),
      distanceKm: input.longestRecentRunKm,
    },
  ];

  const weeks: PlanWeek[] = curve.weeks.map((weekSkeleton) => {
    const { sessions, realizedVolumeKm } = buildWeekSessions(
      weekSkeleton,
      input,
      curve.paces,
      goalPaceSecPerKm,
      tracer,
      history,
    );
    return {
      weekNumber: weekSkeleton.weekNumber,
      startDate: weekSkeleton.startDate,
      endDate: weekSkeleton.endDate,
      phase: weekSkeleton.phase,
      isDeload: weekSkeleton.isDeload,
      isTaper: weekSkeleton.isTaper,
      targetVolumeKm: realizedVolumeKm,
      sessions,
    };
  });

  const violations = [...curve.violations, ...validatePlan(weeks, input)];

  return {
    plan: {
      startDate: input.startDate,
      targetDate: input.goal.targetDate,
      goalDescription: formatGoalDescription(input.goal),
      milestones: curve.milestones,
      weeks,
    },
    fitness: {
      vdot: curve.fitness.vdot,
      confidence: curve.fitness.confidence,
      paces: curve.paces,
    },
    feasibility: curve.feasibility,
    trace: tracer.all(),
    violations,
    ruleSetVersion: RULE_SET_VERSION,
  };
}
