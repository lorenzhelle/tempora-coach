"use client";

import { useState } from "react";
import { formatPace } from "@/lib/coaching/format";
import type { PlanProposal } from "@/lib/coaching/plan-schema";
import { decisionsForTarget, RuleInfo } from "./rule-info";
import { SessionLegend } from "./session-legend";

const DAY_LABELS: Record<string, string> = {
  monday: "Mo",
  tuesday: "Di",
  wednesday: "Mi",
  thursday: "Do",
  friday: "Fr",
  saturday: "Sa",
  sunday: "So",
};

const SESSION_LABELS: Record<string, string> = {
  easy: "Easy",
  tempo: "Tempo",
  interval: "Intervall",
  strength: "Kraft",
  rest: "Ruhe",
  timeTrial: "Test",
};

const FEASIBILITY_LABELS: Record<string, string> = {
  realistic: "Realistisch",
  ambitious: "Ambitioniert",
  unrealistic: "Sehr ambitioniert",
  not_applicable: "Ohne Zielzeit",
};

// Tonally graded fill per phase (docs/design-system.md "Plan card") — not
// expressible as a plain Tailwind color utility, so blended via color-mix
// against the theme vars directly.
const PHASE_BG: Record<string, string> = {
  base: "bg-[color-mix(in_oklch,var(--color-accent)_40%,var(--color-surface-2))]",
  tempo:
    "bg-[color-mix(in_oklch,var(--color-accent)_60%,var(--color-surface-2))]",
  interval:
    "bg-[color-mix(in_oklch,var(--color-accent)_80%,var(--color-surface-2))]",
  race: "bg-accent",
};

// There's no separate "phase overview" model (Spec 2) — phases are
// derived by grouping consecutive weeks, same as the DB layer will do.
function groupPhases(weeks: PlanProposal["weeks"]) {
  const groups: { phase: string; weekCount: number }[] = [];
  for (const week of weeks) {
    const last = groups[groups.length - 1];
    if (last && last.phase === week.phase) {
      last.weekCount += 1;
    } else {
      groups.push({ phase: week.phase, weekCount: 1 });
    }
  }
  return groups;
}

export function PlanCard({
  plan,
  onRequestChange,
}: {
  plan: PlanProposal;
  onRequestChange: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [weekIndex, setWeekIndex] = useState(0);
  const [showPlanWhy, setShowPlanWhy] = useState(false);
  const [showWeekWhy, setShowWeekWhy] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const phases = groupPhases(plan.weeks);
  const week = plan.weeks[weekIndex];
  const planDecisions = decisionsForTarget(plan.trace, "plan");
  const weekDecisions = week
    ? decisionsForTarget(plan.trace, `week-${week.weekNumber}`)
    : [];
  const sessionDecisions =
    week && selectedDay
      ? decisionsForTarget(plan.trace, `week-${week.weekNumber}:${selectedDay}`)
      : [];

  const goToWeek = (nextIndex: number) => {
    setWeekIndex(Math.max(0, Math.min(plan.weeks.length - 1, nextIndex)));
    setSelectedDay(null);
    setShowWeekWhy(false);
  };

  return (
    <div className="flex w-full max-w-[90%] flex-col gap-4 self-start rounded-card border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-heading text-base font-semibold">
          {plan.goalDescription}
        </span>
        <span className="rounded-chip bg-accent-soft px-2.5 py-1 font-mono text-xs font-semibold text-accent-ink">
          {plan.startDate} → {plan.targetDate}
        </span>
      </div>

      {plan.violations.length > 0 && (
        <div className="flex flex-col gap-1 rounded-chip border border-accent bg-accent-soft px-3 py-2 text-[12px]">
          {plan.violations.map((violation) => (
            <p
              key={`${violation.ruleId}-${violation.targetId}`}
              className="m-0"
            >
              {violation.message}
            </p>
          ))}
        </div>
      )}

      <div className="flex h-7 gap-1">
        {phases.map((phase, index) => (
          <div
            key={`${phase.phase}-${index}`}
            className={`flex items-center justify-center rounded-[6px] font-mono text-[11px] text-accent-ink ${PHASE_BG[phase.phase]}`}
            style={{ flexGrow: phase.weekCount }}
            title={`${phase.weekCount} Wochen`}
          >
            {phase.phase}
          </div>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowPlanWhy((value) => !value)}
          className="cursor-pointer font-heading text-[12px] text-text-muted underline decoration-dotted underline-offset-2"
        >
          {showPlanWhy ? "Details ausblenden" : "Wie wurde das berechnet?"}
        </button>
        {showPlanWhy && (
          <div className="mt-2 flex flex-col gap-2 rounded-chip border border-border bg-surface-2 p-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-text-muted">
              <span>
                VDOT {plan.fitness.vdot.toFixed(1)} ({plan.fitness.confidence})
              </span>
              <span>
                Zielbewertung: {FEASIBILITY_LABELS[plan.feasibility.verdict]}
              </span>
              <span>Regelwerk v{plan.ruleSetVersion}</span>
            </div>
            <RuleInfo decisions={planDecisions} />
          </div>
        )}
      </div>

      {week && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => goToWeek(weekIndex - 1)}
              disabled={weekIndex === 0}
              className="cursor-pointer rounded-chip px-2 py-1 text-text-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Vorherige Woche"
            >
              ‹
            </button>
            <p className="m-0 font-heading text-xs tracking-[0.04em] text-text-muted uppercase">
              Woche {week.weekNumber}
              {week.isDeload && " · Deload"}
              {week.isTaper && " · Taper"} · {week.targetVolumeKm.toFixed(1)} km
            </p>
            <button
              type="button"
              onClick={() => goToWeek(weekIndex + 1)}
              disabled={weekIndex === plan.weeks.length - 1}
              className="cursor-pointer rounded-chip px-2 py-1 text-text-muted hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Nächste Woche"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {week.sessions.map((session) => (
              <button
                key={session.dayOfWeek}
                type="button"
                onClick={() =>
                  setSelectedDay((current) =>
                    current === session.dayOfWeek ? null : session.dayOfWeek,
                  )
                }
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-chip border px-1 py-2 text-center hover:border-accent ${
                  selectedDay === session.dayOfWeek
                    ? "border-accent"
                    : "border-border"
                }`}
              >
                <span className="font-mono text-[11px] text-text-muted">
                  {DAY_LABELS[session.dayOfWeek]}
                </span>
                <span className="text-[11px]">
                  {SESSION_LABELS[session.type]}
                </span>
                {session.targetDistanceKm !== null && (
                  <span className="font-mono text-[10px] text-text-muted">
                    {session.targetDistanceKm.toFixed(1)} km
                  </span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowWeekWhy((value) => !value)}
            className="mt-2 cursor-pointer font-heading text-[12px] text-text-muted underline decoration-dotted underline-offset-2"
          >
            {showWeekWhy ? "Wochendetails ausblenden" : "Warum diese Woche?"}
          </button>
          {showWeekWhy && (
            <div className="mt-2">
              <RuleInfo decisions={weekDecisions} />
            </div>
          )}

          {selectedDay && (
            <div className="mt-2 rounded-chip border border-border bg-surface-2 p-3">
              {(() => {
                const session = week.sessions.find(
                  (s) => s.dayOfWeek === selectedDay,
                );
                if (!session) return null;
                return (
                  <>
                    <p className="m-0 mb-2 text-[13px]">
                      {session.description}
                    </p>
                    {session.targetPaceSecPerKm !== null && (
                      <p className="m-0 mb-2 font-mono text-[12px] text-text-muted">
                        Pace: {formatPace(session.targetPaceSecPerKm)}
                      </p>
                    )}
                    <RuleInfo decisions={sessionDecisions} />
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {plan.milestones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {plan.milestones.map((milestone) => (
            <span
              key={`${milestone.label}-${milestone.targetDate}`}
              className="rounded-chip border border-border px-2.5 py-1 font-mono text-[11px] text-text-muted"
            >
              {milestone.label}
              {milestone.targetTimeSeconds !== null &&
                ` · ${Math.floor(milestone.targetTimeSeconds / 60)}:${(milestone.targetTimeSeconds % 60).toString().padStart(2, "0")}`}
            </span>
          ))}
        </div>
      )}

      <SessionLegend />

      {confirmed ? (
        <p className="m-0 text-[13px] text-text-muted">
          Plan bestätigt — das dauerhafte Speichern folgt in einem separaten
          Schritt.
        </p>
      ) : (
        <div className="flex gap-2.5">
          <button
            type="button"
            className="cursor-pointer rounded-control bg-accent px-4 py-2.5 font-heading font-semibold text-accent-ink"
            onClick={() => setConfirmed(true)}
          >
            Confirm plan
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-control border border-border bg-transparent px-4 py-2.5 font-heading font-semibold text-text"
            onClick={onRequestChange}
          >
            Request a change
          </button>
        </div>
      )}
    </div>
  );
}
