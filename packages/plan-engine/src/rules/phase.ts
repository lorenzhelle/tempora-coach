// Phase-gate rules (pipeline step "phases"). Gates are keyed to weeks of
// consistent base training completed, tiered by experience, not to an
// absolute weekly-volume figure — no RCT ties intensity readiness to a
// specific km/week number, and gating on volume alone ignores that
// beginners carry a higher baseline injury risk than returning/continuous
// runners at the same volume. Tempo and interval share a single base-period
// gate rather than each having their own — the RCT this is grounded in
// (Run Clever) tested one base period before intensity progression of any
// kind, and staggering tempo/interval further apart on the calendar isn't
// independently evidenced; once unlocked, per-session volume/rep caps do
// the safety work instead (see session.ts's INTERVAL_SESSION). See
// docs/research/intervalltraining-nach-zieldistanz.md Recommendation (a).

import { QUALITY_BASE_GATE_WEEKS, RACE_BLOCK_WEEKS } from "../constants";
import type { Experience } from "../types";
import { defineRule } from "./define";

export const tempoGateRule = defineRule({
  id: "phase.tempo_gate",
  step: "phases",
  apply({
    weekNumber,
    experience,
  }: {
    weekNumber: number;
    experience: Experience;
  }) {
    const gateWeeks = QUALITY_BASE_GATE_WEEKS[experience];
    const value = weekNumber >= gateWeeks;
    return {
      value,
      inputs: { weekNumber, experience, gateWeeks },
      outcome: value
        ? `Week ${weekNumber} — ${gateWeeks}-week (${experience}) base period complete, unlocks tempo/threshold work`
        : `Week ${weekNumber} — below the ${gateWeeks}-week (${experience}) base-period gate`,
    };
  },
});

export const intervalGateRule = defineRule({
  id: "phase.interval_gate",
  step: "phases",
  apply({
    weekNumber,
    experience,
  }: {
    weekNumber: number;
    experience: Experience;
  }) {
    const gateWeeks = QUALITY_BASE_GATE_WEEKS[experience];
    const value = weekNumber >= gateWeeks;
    return {
      value,
      inputs: { weekNumber, experience, gateWeeks },
      outcome: value
        ? `Week ${weekNumber} — ${gateWeeks}-week (${experience}) base period complete, unlocks VO2max interval work`
        : `Week ${weekNumber} — below the ${gateWeeks}-week (${experience}) base-period gate`,
    };
  },
});

export const raceBlockRule = defineRule({
  id: "phase.race_block",
  step: "phases",
  apply({ weeksToRace }: { weeksToRace: number }) {
    const value = weeksToRace <= RACE_BLOCK_WEEKS;
    return {
      value,
      inputs: { weeksToRace, raceBlockWeeks: RACE_BLOCK_WEEKS },
      outcome: value
        ? `${weeksToRace} week(s) out — race phase`
        : `${weeksToRace} weeks out — not yet the race block`,
    };
  },
});

export const maintenanceMesocyclesRule = defineRule({
  id: "phase.maintenance_mesocycles",
  step: "phases",
  apply({ horizonWeeks }: { horizonWeeks: number }) {
    return {
      value: true,
      inputs: { horizonWeeks },
      outcome: `Weeks beyond the initial ~6-month build continue the 3:1 rhythm at maintenance volume; quality composition keeps following the same volume gates across all ${horizonWeeks} weeks`,
    };
  },
});
