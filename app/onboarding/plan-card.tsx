"use client";

import { useState } from "react";
import type { PlanProposal } from "@/lib/coaching/plan-schema";

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

export function PlanCard({
  plan,
  onRequestChange,
}: {
  plan: PlanProposal;
  onRequestChange: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

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

      <div className="flex h-7 gap-1">
        {plan.phases.map((phase) => (
          <div
            key={phase.phase}
            className={`flex items-center justify-center rounded-[6px] font-mono text-[11px] text-accent-ink ${PHASE_BG[phase.phase]}`}
            style={{ flexGrow: phase.weekCount }}
            title={`${phase.focus} (${phase.weekCount} Wochen)`}
          >
            {phase.phase}
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 font-heading text-xs tracking-[0.04em] text-text-muted uppercase">
          Woche 1
        </p>
        <div className="grid grid-cols-7 gap-1.5">
          {plan.week1.sessions.map((session) => (
            <div
              key={session.dayOfWeek}
              className="flex flex-col items-center gap-1 rounded-chip border border-border px-1 py-2 text-center"
            >
              <span className="font-mono text-[11px] text-text-muted">
                {DAY_LABELS[session.dayOfWeek]}
              </span>
              <span className="text-[11px]">
                {SESSION_LABELS[session.type]}
              </span>
            </div>
          ))}
        </div>
      </div>

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
