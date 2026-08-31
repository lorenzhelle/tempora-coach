// Pipeline steps 6-9: weekly allocation, day placement, and per-session
// prescriptions — turning a WeekSkeleton (phase + nominal volume) into a
// full 7-day PlannedSession[]. Enforces the spike ceiling (longrun.spike_ceiling)
// forward across the whole plan via a rolling run-history array threaded
// through by the caller (pipeline/index.ts).

import { SPIKE_LOOKBACK_DAYS } from "../constants";
import {
  intensitySplitRule,
  qualitySessionCountRule,
  runsPerWeekRule,
  strengthSessionsRule,
  timeTrialCadenceRule,
} from "../rules/allocation";
import type { Tracer, TraceTarget } from "../rules/define";
import { longRunShareCapRule, spikeCeilingRule } from "../rules/longRun";
import {
  longRunOnPreferredDayRule,
  noBackToBackHardRule,
  restFillsRemainderRule,
  strengthOffQualityDaysRule,
} from "../rules/placement";
import {
  durationFromDistanceRule,
  intervalStructureRule,
  paceFromZoneRule,
  qualitySessionDistanceKm,
} from "../rules/session";
import type {
  DayOfWeek,
  PaceZones,
  PlanInput,
  PlannedSession,
  SessionType,
} from "../types";
import {
  ALL_DAYS_OF_WEEK,
  addDays,
  cyclicDistance,
  datesForWeek,
  orderedFrom,
} from "../util/dates";
import type { WeekSkeleton } from "./curve";

export type RunHistoryEntry = { date: string; distanceKm: number };

/** The longest run in [asOfDate - lookbackDays, asOfDate) — strictly before asOfDate, per the RUNSAFE methodology. */
function rollingLongestKm(
  history: RunHistoryEntry[],
  asOfDate: string,
  lookbackDays: number,
): number {
  const cutoff = addDays(asOfDate, -lookbackDays);
  let max = 0;
  for (const entry of history) {
    if (entry.date >= cutoff && entry.date < asOfDate)
      max = Math.max(max, entry.distanceKm);
  }
  return max;
}

type AssignedDay = { dayOfWeek: DayOfWeek; type: SessionType };

/**
 * Assigns a SessionType to each of the 7 days: long run/time trial on the
 * stated day, quality sessions spaced >=2 days from it and each other,
 * easy runs filling remaining running slots, strength on non-quality
 * days, rest filling whatever's left (the FastAsYouCan pattern: explicit
 * key sessions first, auto-fill, remainder = rest).
 */
export function assignSessionTypes(params: {
  runsPerWeek: number;
  qualityCount: number;
  longRunDay: DayOfWeek;
  strengthCount: number;
  isDeload: boolean;
}): AssignedDay[] {
  const { runsPerWeek, qualityCount, longRunDay, strengthCount, isDeload } =
    params;
  const order = orderedFrom(longRunDay);
  const assignment = new Map<DayOfWeek, SessionType>(
    ALL_DAYS_OF_WEEK.map((d) => [d, "rest"]),
  );

  assignment.set(longRunDay, isDeload ? "timeTrial" : "easy");

  const qualityDays: DayOfWeek[] = [];
  if (!isDeload) {
    for (const day of order) {
      if (qualityDays.length >= qualityCount) break;
      if (day === longRunDay) continue;
      const farFromLongRun = cyclicDistance(day, longRunDay) >= 2;
      const farFromOtherQuality = qualityDays.every(
        (qd) => cyclicDistance(day, qd) >= 2,
      );
      if (farFromLongRun && farFromOtherQuality) {
        qualityDays.push(day);
        assignment.set(day, qualityDays.length === 1 ? "tempo" : "interval");
      }
    }
  }

  const runningSlotsUsed = 1 + qualityDays.length;
  const easyNeeded = Math.max(0, runsPerWeek - runningSlotsUsed);
  const easyDays: DayOfWeek[] = [];
  for (const day of order) {
    if (easyDays.length >= easyNeeded) break;
    if (assignment.get(day) === "rest") {
      easyDays.push(day);
      assignment.set(day, "easy");
    }
  }

  const strengthDays: DayOfWeek[] = [];
  for (const day of order) {
    if (strengthDays.length >= strengthCount) break;
    if (assignment.get(day) === "rest") {
      strengthDays.push(day);
      assignment.set(day, "strength");
    }
  }

  return ALL_DAYS_OF_WEEK.map((dayOfWeek) => {
    const type = assignment.get(dayOfWeek);
    if (!type) throw new Error(`unreachable: ${dayOfWeek} was never assigned`);
    return { dayOfWeek, type };
  });
}

function formatPace(secPerKm: number): string {
  const totalSeconds = Math.round(secPerKm);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

function describeSession(
  type: SessionType,
  distanceKm: number,
  paceSecPerKm: number | null,
  isLongRunDay: boolean,
  gymAccess: boolean | undefined,
): string {
  const paceLabel =
    paceSecPerKm !== null ? ` @ ${formatPace(paceSecPerKm)}` : "";
  if (type === "rest") return "Rest day";
  if (type === "strength")
    return gymAccess === false
      ? "Strength: bodyweight circuit"
      : "Strength: gym circuit";
  if (type === "timeTrial")
    return `Time trial: ${distanceKm.toFixed(1)} km${paceLabel}`;
  if (type === "tempo") return `Tempo: ${distanceKm.toFixed(1)} km${paceLabel}`;
  if (type === "interval")
    return `Intervals: ${distanceKm.toFixed(1)} km total (work + recovery)${paceLabel}`;
  return `Easy: ${distanceKm.toFixed(1)} km${paceLabel}${isLongRunDay ? " (long run)" : ""}`;
}

export function buildWeekSessions(
  week: WeekSkeleton,
  input: PlanInput,
  paces: PaceZones,
  goalPaceSecPerKm: number | null,
  tracer: Tracer,
  history: RunHistoryEntry[],
): { sessions: PlannedSession[]; realizedVolumeKm: number } {
  const target: TraceTarget = {
    scope: "week",
    targetId: `week-${week.weekNumber}`,
  };

  const runsPerWeek = tracer.run(
    runsPerWeekRule,
    {
      volumeKm: week.targetVolumeKm,
      availableDaysPerWeek: input.availableDaysPerWeek,
    },
    target,
  );
  const rawQualityCount = tracer.run(
    qualitySessionCountRule,
    { phase: week.phase, isDeload: week.isDeload },
    target,
  );
  const qualityCount = Math.min(rawQualityCount, Math.max(0, runsPerWeek - 1));
  const easyShareFraction = tracer.run(
    intensitySplitRule,
    { runsPerWeek },
    target,
  );
  const strengthCount = tracer.run(
    strengthSessionsRule,
    { nonRunningDaysAvailable: Math.max(0, 7 - runsPerWeek) },
    target,
  );
  tracer.run(timeTrialCadenceRule, { isDeload: week.isDeload }, target);

  const dayTypes = assignSessionTypes({
    runsPerWeek,
    qualityCount,
    longRunDay: input.longRunDay,
    strengthCount,
    isDeload: week.isDeload,
  });

  const hardDays = dayTypes
    .filter((d) => d.type === "tempo" || d.type === "interval")
    .map((d) => d.dayOfWeek);
  const strengthDays = dayTypes
    .filter((d) => d.type === "strength")
    .map((d) => d.dayOfWeek);
  const restDays = dayTypes
    .filter((d) => d.type === "rest")
    .map((d) => d.dayOfWeek);
  tracer.run(
    longRunOnPreferredDayRule,
    { longRunDay: input.longRunDay },
    target,
  );
  tracer.run(noBackToBackHardRule, { hardDays }, target);
  tracer.run(strengthOffQualityDaysRule, { strengthDays }, target);
  tracer.run(restFillsRemainderRule, { restDays }, target);

  const dateFor = datesForWeek(week.startDate);
  const nominalLongRunKm = tracer.run(
    longRunShareCapRule,
    { weeklyVolumeKm: week.targetVolumeKm },
    target,
  );
  const qualityDaysList = dayTypes
    .filter((d) => d.type === "tempo" || d.type === "interval")
    .map((d) => d.dayOfWeek);
  const easyDaysList = dayTypes
    .filter((d) => d.type === "easy" && d.dayOfWeek !== input.longRunDay)
    .map((d) => d.dayOfWeek);
  const tempoDistanceKm = qualitySessionDistanceKm(
    week.targetVolumeKm,
    qualityCount,
    easyShareFraction,
  );
  const remainingForEasy = Math.max(
    0,
    week.targetVolumeKm -
      nominalLongRunKm -
      qualityDaysList.length * tempoDistanceKm,
  );
  const perEasyDayKm =
    easyDaysList.length > 0 ? remainingForEasy / easyDaysList.length : 0;

  const daysInDateOrder = [...dayTypes]
    .map((d) => ({ ...d, date: dateFor[d.dayOfWeek] }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const sessions: PlannedSession[] = [];
  let realizedVolumeKm = 0;

  for (const { dayOfWeek, type, date } of daysInDateOrder) {
    const sessionTarget: TraceTarget = {
      scope: "session",
      targetId: `week-${week.weekNumber}:${dayOfWeek}`,
    };

    if (type === "rest" || type === "strength") {
      sessions.push({
        dayOfWeek,
        date,
        type,
        distanceKm: null,
        durationMin: null,
        paceSecPerKm: null,
        description: describeSession(type, 0, null, false, input.gymAccess),
      });
      continue;
    }

    const isLongRunDay = dayOfWeek === input.longRunDay;
    let candidateKm: number;
    if (isLongRunDay) candidateKm = nominalLongRunKm;
    else if (type === "interval")
      candidateKm = tracer.run(
        intervalStructureRule,
        {
          zonePaceSecPerKm: paces.interval.paceSecPerKm,
          weeklyVolumeKm: week.targetVolumeKm,
          qualityCount,
          easyShareFraction,
        },
        sessionTarget,
      );
    else if (type === "tempo") candidateKm = tempoDistanceKm;
    else candidateKm = perEasyDayKm;

    const rollingLongest = rollingLongestKm(history, date, SPIKE_LOOKBACK_DAYS);
    const distanceKm = tracer.run(
      spikeCeilingRule,
      { candidateKm, rollingLongestKm: rollingLongest },
      sessionTarget,
    );

    const paceSecPerKm = tracer.run(
      paceFromZoneRule,
      { type, paces, goalPaceSecPerKm },
      sessionTarget,
    );
    const durationMin =
      paceSecPerKm !== null
        ? tracer.run(
            durationFromDistanceRule,
            { distanceKm, paceSecPerKm },
            sessionTarget,
          )
        : null;

    history.push({ date, distanceKm });
    realizedVolumeKm += distanceKm;

    sessions.push({
      dayOfWeek,
      date,
      type,
      distanceKm,
      durationMin,
      paceSecPerKm,
      description: describeSession(
        type,
        distanceKm,
        paceSecPerKm,
        isLongRunDay,
        input.gymAccess,
      ),
    });
  }

  return { sessions, realizedVolumeKm };
}
