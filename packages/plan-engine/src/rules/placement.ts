// Day-placement rules (pipeline step "placement"). Unlike most rules
// here, these don't each independently compute a value — placing 7 days'
// worth of sessions is one constraint-satisfaction problem (see
// pipeline/week.ts's assignSessionTypes), not four independent
// calculations. Each rule instead traces one named aspect of that
// already-computed assignment, so the "why" reveal still cites the
// specific principle behind each placement choice.

import type { DayOfWeek } from "../types";
import { defineRule } from "./define";

export const longRunOnPreferredDayRule = defineRule({
  id: "days.long_run_on_preferred_day",
  step: "placement",
  apply({ longRunDay }: { longRunDay: DayOfWeek }) {
    return {
      value: longRunDay,
      inputs: { longRunDay },
      outcome: `Long run / time trial placed on ${longRunDay}, as requested`,
    };
  },
});

export const noBackToBackHardRule = defineRule({
  id: "days.no_back_to_back_hard",
  step: "placement",
  apply({ hardDays }: { hardDays: DayOfWeek[] }) {
    return {
      value: hardDays,
      inputs: { hardDayCount: hardDays.length },
      outcome:
        hardDays.length > 0
          ? `Hard day(s) placed at least 2 days apart: ${hardDays.join(", ")}`
          : "No hard days to space out this week",
    };
  },
});

export const strengthOffQualityDaysRule = defineRule({
  id: "days.strength_off_quality_days",
  step: "placement",
  apply({ strengthDays }: { strengthDays: DayOfWeek[] }) {
    return {
      value: strengthDays,
      inputs: { strengthDayCount: strengthDays.length },
      outcome:
        strengthDays.length > 0
          ? `Strength placed on ${strengthDays.join(", ")} — never on a quality or long-run day`
          : "No strength session fit this week",
    };
  },
});

export const restFillsRemainderRule = defineRule({
  id: "days.rest_fills_remainder",
  step: "placement",
  apply({ restDays }: { restDays: DayOfWeek[] }) {
    return {
      value: restDays,
      inputs: { restDayCount: restDays.length },
      outcome: `${restDays.length} rest day(s): ${restDays.length > 0 ? restDays.join(", ") : "none"}`,
    };
  },
});
