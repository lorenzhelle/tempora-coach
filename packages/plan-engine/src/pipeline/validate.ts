// Pipeline step 10: post-generation validators. Each returns Violation[]
// rather than throwing — a validator failing is information for the
// caller (and, eventually, the UI), not a crash. In a correctly working
// generator these should never fire; they exist as defense-in-depth
// regression protection, most importantly for the spike ceiling.

import {
  EASY_SHARE,
  HORIZON_CAP_WEEKS,
  SPIKE_CEILING_MULTIPLIER,
  SPIKE_LOOKBACK_DAYS,
} from "../constants";
import type { PlanInput, PlanWeek, Violation } from "../types";
import { addDays, diffInDays } from "../util/dates";
import type { RunHistoryEntry } from "./week";

export function validatePlan(weeks: PlanWeek[], input: PlanInput): Violation[] {
  const violations: Violation[] = [];

  if (weeks.length > HORIZON_CAP_WEEKS) {
    violations.push({
      ruleId: "check.horizon",
      message: `Plan has ${weeks.length} weeks, exceeding the ${HORIZON_CAP_WEEKS}-week cap.`,
      targetId: "plan",
    });
  }

  for (const week of weeks) {
    const sum = week.sessions.reduce(
      (total, session) => total + (session.distanceKm ?? 0),
      0,
    );
    if (Math.abs(sum - week.targetVolumeKm) > 0.01) {
      violations.push({
        ruleId: "check.weekly_sum",
        message: `Week ${week.weekNumber}: session distances sum to ${sum.toFixed(2)} km but targetVolumeKm is ${week.targetVolumeKm.toFixed(2)} km.`,
        targetId: `week-${week.weekNumber}`,
      });
    }
  }

  const history: RunHistoryEntry[] = [
    {
      date: addDays(input.startDate, -1),
      distanceKm: input.longestRecentRunKm,
    },
  ];
  for (const week of weeks) {
    const sortedSessions = [...week.sessions].sort((a, b) =>
      a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
    );
    for (const session of sortedSessions) {
      if (session.distanceKm === null) continue;
      const cutoff = addDays(session.date, -SPIKE_LOOKBACK_DAYS);
      const rollingLongest = history
        .filter((entry) => entry.date >= cutoff && entry.date < session.date)
        .reduce((max, entry) => Math.max(max, entry.distanceKm), 0);
      const ceilingKm = rollingLongest * SPIKE_CEILING_MULTIPLIER;
      if (session.distanceKm > ceilingKm + 1e-6) {
        violations.push({
          ruleId: "check.spike_ceiling",
          message: `${session.date} (${session.dayOfWeek}): ${session.distanceKm.toFixed(1)} km exceeds the ${ceilingKm.toFixed(1)} km spike ceiling.`,
          targetId: `week-${week.weekNumber}:${session.dayOfWeek}`,
        });
      }
      history.push({ date: session.date, distanceKm: session.distanceKm });
    }
  }

  for (const week of weeks) {
    if (week.isDeload || week.isTaper) continue; // no separate quality work those weeks — an 80/20 check would be a false positive
    const runningSessions = week.sessions.filter((s) => s.distanceKm !== null);
    const totalKm = runningSessions.reduce(
      (total, s) => total + (s.distanceKm ?? 0),
      0,
    );
    if (totalKm === 0) continue;
    const easyKm = runningSessions
      .filter((s) => s.type === "easy")
      .reduce((total, s) => total + (s.distanceKm ?? 0), 0);
    const minShare =
      runningSessions.length <= EASY_SHARE.lowDaysThreshold
        ? EASY_SHARE.lowDaysFallback
        : EASY_SHARE.standard;
    const actualShare = easyKm / totalKm;
    if (actualShare < minShare - 0.05) {
      violations.push({
        ruleId: "check.easy_share",
        message: `Week ${week.weekNumber}: easy share ${(actualShare * 100).toFixed(0)}% is below the ${(minShare * 100).toFixed(0)}% target.`,
        targetId: `week-${week.weekNumber}`,
      });
    }
  }

  for (const week of weeks) {
    const hardDates = week.sessions
      .filter(
        (s) =>
          s.type === "tempo" ||
          s.type === "interval" ||
          (s.dayOfWeek === input.longRunDay && s.distanceKm !== null),
      )
      .map((s) => s.date)
      .sort();
    for (let i = 1; i < hardDates.length; i++) {
      const previous = hardDates[i - 1];
      const current = hardDates[i];
      if (!previous || !current) continue;
      const gapDays = diffInDays(previous, current);
      if (gapDays < 2) {
        violations.push({
          ruleId: "check.hard_spacing",
          message: `Week ${week.weekNumber}: two hard sessions only ${gapDays} day(s) apart.`,
          targetId: `week-${week.weekNumber}`,
        });
      }
    }
  }

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    const previous = weeks[i - 1];
    if (
      !week?.isDeload ||
      i === 0 ||
      !previous ||
      previous.isDeload ||
      previous.isTaper
    )
      continue;
    const ratio = week.targetVolumeKm / previous.targetVolumeKm;
    // Generous band around the nominal 80% deload factor. The deload
    // week's *nominal* target is exactly 80% of the preceding week's
    // *nominal* volume (volume.deload_3_1, computed in curve.ts) — but
    // this check compares *realized* (post-spike-ceiling) sums instead,
    // since that's what actually shipped in the plan. A build week whose
    // long run got truncated by the spike ceiling realizes below its
    // nominal target, which pushes the following deload week's realized
    // ratio up toward (and occasionally past) 95% even though the
    // nominal 80% cut was applied correctly — verified directly (week 20
    // in the returner-from-10km scenario: 95.03%). That's the spike
    // ceiling doing its job, not a broken deload; the upper bound is
    // widened to 98% to stop flagging it while still catching a deload
    // that didn't reduce volume at all.
    if (ratio < 0.55 || ratio > 0.98) {
      violations.push({
        ruleId: "check.deload_cadence",
        message: `Week ${week.weekNumber}: deload ratio ${(ratio * 100).toFixed(0)}% of the preceding week is outside the expected 55-98% band.`,
        targetId: `week-${week.weekNumber}`,
      });
    }
  }

  return violations;
}
