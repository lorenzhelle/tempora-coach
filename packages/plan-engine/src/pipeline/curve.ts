// Pipeline steps 1-5: fitness index, training paces, goal/feasibility,
// milestones, and the per-week phase + volume skeleton for the whole
// horizon. Session-level detail (steps 6-9) is built on top of this in
// week.ts. See docs/research/designing-a-plan-generator.md §5 for the
// step numbering this mirrors.

import {
  DETRAINING_DISCOUNT,
  HORIZON_CAP_WEEKS,
  TAPER_WEEKS,
  WEEKS_PER_MONTH,
} from "../constants";
import type { Tracer, TraceTarget } from "../rules/define";
import {
  baselineVdotFromVolumeRule,
  danielsZonesRule,
  detrainingDiscountRule,
  vdotFromResultRule,
} from "../rules/fitness";
import {
  feasibilityGapRule,
  horizonCapRule,
  milestonesFromRiegelRule,
  requiredVdotRule,
} from "../rules/goal";
import {
  intervalGateRule,
  maintenanceMesocyclesRule,
  raceBlockRule,
  tempoGateRule,
} from "../rules/phase";
import {
  volumeBuildStepRule,
  volumeConservativeMultiplierRule,
  volumeDeloadRule,
  volumePostDeloadRestartRule,
  volumeStartRule,
  volumeTaperRule,
  volumeTargetCapRule,
} from "../rules/volume";
import type {
  FeasibilityVerdict,
  Milestone,
  PaceZones,
  Phase,
  PlanInput,
  RaceResult,
  Violation,
} from "../types";
import { addDays, diffInWeeks } from "../util/dates";

const PLAN_TARGET: TraceTarget = { scope: "plan", targetId: "plan" };

function weekTarget(weekNumber: number): TraceTarget {
  return { scope: "week", targetId: `week-${weekNumber}` };
}

function bestAvailableResult(input: PlanInput): RaceResult | null {
  return input.recentTimeTrial ?? input.personalBest ?? null;
}

function resolveFitness(
  input: PlanInput,
  tracer: Tracer,
): { vdot: number; confidence: "high" | "medium" | "low" } {
  const result = bestAvailableResult(input);
  if (!result) {
    const vdot = tracer.run(
      baselineVdotFromVolumeRule,
      {
        currentWeeklyVolumeKm: input.currentWeeklyVolumeKm,
        experience: input.experience,
      },
      PLAN_TARGET,
    );
    return { vdot, confidence: "low" };
  }

  const rawVdot = tracer.run(vdotFromResultRule, result, PLAN_TARGET);

  const isStalePersonalBest =
    input.experience === "returner" &&
    !input.recentTimeTrial &&
    input.personalBest !== undefined;
  if (isStalePersonalBest && input.personalBest) {
    const weeksSincePb = input.personalBest.achievedMonthsAgo * WEEKS_PER_MONTH;
    if (weeksSincePb >= DETRAINING_DISCOUNT.minWeeksToApply) {
      const vdot = tracer.run(
        detrainingDiscountRule,
        { rawVdot, weeksSincePb },
        PLAN_TARGET,
      );
      return { vdot, confidence: "low" };
    }
  }

  return {
    vdot: rawVdot,
    confidence: input.recentTimeTrial ? "high" : "medium",
  };
}

function isDeloadIndex(index: number): boolean {
  return (index + 1) % 4 === 0;
}

export type WeekSkeleton = {
  weekNumber: number;
  startDate: string;
  endDate: string;
  phase: Phase;
  isDeload: boolean;
  isTaper: boolean;
  targetVolumeKm: number;
};

export type CurveResult = {
  fitness: { vdot: number; confidence: "high" | "medium" | "low" };
  paces: PaceZones;
  feasibility: {
    requiredVdot: number | null;
    gapPct: number | null;
    verdict: FeasibilityVerdict;
  };
  milestones: Milestone[];
  horizonWeeks: number;
  weeks: WeekSkeleton[];
  violations: Violation[];
};

export function buildCurve(input: PlanInput, tracer: Tracer): CurveResult {
  const violations: Violation[] = [];

  const fitness = resolveFitness(input, tracer);
  const paces = tracer.run(
    danielsZonesRule,
    { vdot: fitness.vdot },
    PLAN_TARGET,
  );

  const requestedWeeks = diffInWeeks(input.startDate, input.goal.targetDate);
  const horizonWeeks = Math.max(
    1,
    Math.round(tracer.run(horizonCapRule, { requestedWeeks }, PLAN_TARGET)),
  );
  if (requestedWeeks > HORIZON_CAP_WEEKS) {
    violations.push({
      ruleId: "goal.horizon_cap_12_months",
      message: `Goal date is ${requestedWeeks.toFixed(1)} weeks out; clamped to the ${HORIZON_CAP_WEEKS}-week cap.`,
      targetId: "plan",
    });
  }

  let requiredVdot: number | null = null;
  let gapPct: number | null = null;
  let verdict: FeasibilityVerdict = "not_applicable";
  if (input.goal.targetTimeSeconds !== undefined) {
    requiredVdot = tracer.run(
      requiredVdotRule,
      {
        distanceMeters: input.goal.distanceMeters,
        targetTimeSeconds: input.goal.targetTimeSeconds,
      },
      PLAN_TARGET,
    );
    const gap = tracer.run(
      feasibilityGapRule,
      { currentVdot: fitness.vdot, requiredVdot, horizonWeeks },
      PLAN_TARGET,
    );
    gapPct = gap.gapPct;
    verdict = gap.verdict;
  }

  const currentResult = bestAvailableResult(input);
  const milestoneCount = Math.min(
    3,
    Math.max(0, Math.floor(horizonWeeks / 8) - 1),
  );
  const milestoneFractions = Array.from(
    { length: milestoneCount },
    (_, i) => (i + 1) / (milestoneCount + 1),
  );
  const milestoneTimes = tracer.run(
    milestonesFromRiegelRule,
    {
      currentResult,
      goalDistanceMeters: input.goal.distanceMeters,
      goalTargetTimeSeconds: input.goal.targetTimeSeconds ?? null,
      milestoneFractions,
    },
    PLAN_TARGET,
  );
  const milestones: Milestone[] = milestoneFractions.map((fraction, i) => {
    const milestoneWeek = Math.round(fraction * horizonWeeks);
    const time = milestoneTimes[i];
    return {
      label: `Checkpoint (week ${milestoneWeek})`,
      targetTimeSeconds:
        time !== null && time !== undefined ? Math.round(time) : null,
      targetDate: addDays(input.startDate, milestoneWeek * 7),
    };
  });
  milestones.push({
    label: "Goal",
    targetTimeSeconds: input.goal.targetTimeSeconds ?? null,
    targetDate: input.goal.targetDate,
  });

  const conservativeMultiplier = tracer.run(
    volumeConservativeMultiplierRule,
    { priorStressFracture: input.priorStressFracture ?? false },
    PLAN_TARGET,
  );
  const targetVolumeKm = tracer.run(
    volumeTargetCapRule,
    {
      goalDistanceMeters: input.goal.distanceMeters,
      currentWeeklyVolumeKm: input.currentWeeklyVolumeKm,
    },
    PLAN_TARGET,
  );
  tracer.run(maintenanceMesocyclesRule, { horizonWeeks }, PLAN_TARGET);

  const taperWeeksCount = Math.min(TAPER_WEEKS, Math.max(0, horizonWeeks - 1));
  const taperStartIndex = horizonWeeks - taperWeeksCount;

  const weeks: WeekSkeleton[] = [];
  const volumeByIndex: number[] = [];

  for (let i = 0; i < horizonWeeks; i++) {
    const weekNumber = i + 1;
    const target = weekTarget(weekNumber);
    const startDate = addDays(input.startDate, i * 7);
    const endDate = addDays(startDate, 6);
    const isTaperWeek = i >= taperStartIndex;
    const isDeload = !isTaperWeek && i > 0 && isDeloadIndex(i);

    let volumeKm: number;
    if (isTaperWeek) {
      const preTaperKm =
        volumeByIndex[taperStartIndex - 1] ?? input.currentWeeklyVolumeKm;
      volumeKm = tracer.run(
        volumeTaperRule,
        { preTaperKm, weeksFromRace: horizonWeeks - weekNumber + 1 },
        target,
      );
    } else if (i === 0) {
      volumeKm = tracer.run(
        volumeStartRule,
        { currentWeeklyVolumeKm: input.currentWeeklyVolumeKm },
        target,
      );
    } else if (isDeload) {
      const previousBuildKm =
        volumeByIndex[i - 1] ?? input.currentWeeklyVolumeKm;
      volumeKm = tracer.run(volumeDeloadRule, { previousBuildKm }, target);
    } else {
      const previousWasDeload = i >= 1 && isDeloadIndex(i - 1);
      if (previousWasDeload && i >= 2) {
        const preDeloadPeakKm =
          volumeByIndex[i - 2] ?? input.currentWeeklyVolumeKm;
        volumeKm = tracer.run(
          volumePostDeloadRestartRule,
          { preDeloadPeakKm, conservativeMultiplier, targetKm: targetVolumeKm },
          target,
        );
      } else {
        const previousKm = volumeByIndex[i - 1] ?? input.currentWeeklyVolumeKm;
        volumeKm = tracer.run(
          volumeBuildStepRule,
          { previousKm, conservativeMultiplier, targetKm: targetVolumeKm },
          target,
        );
      }
    }
    volumeByIndex.push(volumeKm);

    const weeksToRace = horizonWeeks - weekNumber + 1;
    const inRaceBlock = tracer.run(raceBlockRule, { weeksToRace }, target);
    const intervalUnlocked = tracer.run(intervalGateRule, { volumeKm }, target);
    const tempoUnlocked = tracer.run(tempoGateRule, { volumeKm }, target);
    const phase: Phase = inRaceBlock
      ? "race"
      : intervalUnlocked
        ? "interval"
        : tempoUnlocked
          ? "tempo"
          : "base";

    weeks.push({
      weekNumber,
      startDate,
      endDate,
      phase,
      isDeload,
      isTaper: isTaperWeek,
      targetVolumeKm: volumeKm,
    });
  }

  return {
    fitness,
    paces,
    feasibility: { requiredVdot, gapPct, verdict },
    milestones,
    horizonWeeks,
    weeks,
    violations,
  };
}
