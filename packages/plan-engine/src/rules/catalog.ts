// RuleId -> user-facing copy + citation. Rule text and sources live here,
// never inline in a system prompt — that's what lets the coaching agent's
// explanation stay tied to the computation that actually ran, instead of
// drifting into an invented rationale. The UI renders `plain` under an
// info icon and `technical` + `source` on expand (progressive disclosure,
// per docs/research/designing-a-plan-generator.md §4).

import { RULE_SOURCES } from "../constants";
import type { RuleId } from "../types";

export type CatalogEntry = {
  title: string;
  /** One plain-language sentence for the always-visible info icon. */
  plain: string;
  /** A fuller, technical explanation for the expanded view. */
  technical: string;
  source: string;
};

export const RULE_CATALOG: Record<RuleId, CatalogEntry> = {
  "fitness.vdot_from_result": {
    title: "Fitness index from your result",
    plain:
      "We turned your race or time-trial result into a single fitness number (VDOT) that all your training paces are based on.",
    technical:
      "VDOT is computed from the Daniels-Gilbert (1979) oxygen-cost equation and %VO2max-sustainable-for-duration equation, applied to the most recent qualifying result (a time trial or personal best).",
    source: RULE_SOURCES["fitness.vdot_from_result"],
  },
  "paces.daniels_zones": {
    title: "Training paces per zone",
    plain:
      "Your easy, marathon, threshold, interval, and repetition paces are set as fixed percentages of your fitness index.",
    technical:
      "Each zone's pace is derived by inverting the Daniels-Gilbert VO2 equation at the zone's %VDOT band midpoint (Easy 59-74%, Marathon 75-84%, Threshold 83-88%, Interval 95-100%, Repetition 105-120%).",
    source: RULE_SOURCES["paces.daniels_zones"],
  },
  "fitness.riegel_equivalent": {
    title: "Equivalent times at other distances",
    plain:
      "We cross-check your fitness estimate against a second, independent formula based on race-distance scaling.",
    technical:
      "Riegel's power law (T2 = T1 * (D2/D1)^1.06) predicts equivalent race times at other distances, used as a cross-check on VDOT and to set intermediate milestones.",
    source: RULE_SOURCES["fitness.riegel_equivalent"],
  },
};
