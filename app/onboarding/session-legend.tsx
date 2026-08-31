// Static, always-accurate one-line-per-type legend (docs/specs/03-onboarding/spec.md
// "Explaining workouts") — the six session types never change, so this
// doesn't need to be LLM-generated.

const LEGEND: { type: string; label: string; description: string }[] = [
  {
    type: "easy",
    label: "Easy",
    description:
      "Comfortable, conversational-pace running — most of your weekly volume.",
  },
  {
    type: "tempo",
    label: "Tempo",
    description:
      "A sustained effort at threshold pace, right at the edge of comfortable.",
  },
  {
    type: "interval",
    label: "Intervals",
    description:
      "Short, repeated hard efforts with easy jogging recovery in between.",
  },
  {
    type: "strength",
    label: "Strength",
    description:
      "A gym circuit or bodyweight routine, depending on your access.",
  },
  {
    type: "rest",
    label: "Rest",
    description:
      "A full day off running — where the actual adaptation happens.",
  },
  {
    type: "timeTrial",
    label: "Time trial",
    description:
      "An all-out effort at your goal pace, used to recalibrate the plan.",
  },
];

export function SessionLegend() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-chip border border-border bg-surface-2 p-3 text-[12px] sm:grid-cols-3">
      {LEGEND.map((item) => (
        <div key={item.type} className="flex flex-col gap-0.5">
          <span className="font-heading font-semibold">{item.label}</span>
          <span className="text-text-muted leading-tight">
            {item.description}
          </span>
        </div>
      ))}
    </div>
  );
}
