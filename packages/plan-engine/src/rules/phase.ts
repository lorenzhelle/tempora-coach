// Phase-gate rules (pipeline step "phases"). Gates are keyed to volume
// reached, not the calendar, so a runner who starts at high volume gets
// quality work from week 1 and phase boundaries stay adaptive rather than
// fixed to a calendar — see docs/research/onboarding-und-trainingsmethodik.md.

import { PHASE_VOLUME_GATES, RACE_BLOCK_WEEKS } from "../constants";
import { defineRule } from "./define";

export const tempoGateRule = defineRule({
  id: "phase.tempo_gate",
  step: "phases",
  apply({ volumeKm }: { volumeKm: number }) {
    const value = volumeKm >= PHASE_VOLUME_GATES.tempoKm;
    return {
      value,
      inputs: { volumeKm, gateKm: PHASE_VOLUME_GATES.tempoKm },
      outcome: value
        ? `${volumeKm.toFixed(1)} km/wk unlocks tempo/threshold work`
        : `${volumeKm.toFixed(1)} km/wk — below the ${PHASE_VOLUME_GATES.tempoKm} km tempo gate`,
    };
  },
});

export const intervalGateRule = defineRule({
  id: "phase.interval_gate",
  step: "phases",
  apply({ volumeKm }: { volumeKm: number }) {
    const value = volumeKm >= PHASE_VOLUME_GATES.intervalKm;
    return {
      value,
      inputs: { volumeKm, gateKm: PHASE_VOLUME_GATES.intervalKm },
      outcome: value
        ? `${volumeKm.toFixed(1)} km/wk unlocks VO2max interval work`
        : `${volumeKm.toFixed(1)} km/wk — below the ${PHASE_VOLUME_GATES.intervalKm} km interval gate`,
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
