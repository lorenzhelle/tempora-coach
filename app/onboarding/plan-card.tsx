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

export function PlanCard({
  plan,
  onRequestChange,
}: {
  plan: PlanProposal;
  onRequestChange: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="plan-card">
      <div className="plan-card-header">
        <span className="plan-card-goal">{plan.goalDescription}</span>
        <span className="plan-card-timeframe">
          {plan.startDate} → {plan.targetDate}
        </span>
      </div>

      <div className="phase-bar">
        {plan.phases.map((phase) => (
          <div
            key={phase.phase}
            className={`phase-segment phase-segment-${phase.phase}`}
            style={{ flexGrow: phase.weekCount }}
            title={`${phase.focus} (${phase.weekCount} Wochen)`}
          >
            {phase.phase}
          </div>
        ))}
      </div>

      <div>
        <p className="week-strip-label">Woche 1</p>
        <div className="week-strip">
          {plan.week1.sessions.map((session) => (
            <div key={session.dayOfWeek} className="day-cell">
              <span className="day-label">{DAY_LABELS[session.dayOfWeek]}</span>
              <span className="session-type">
                {SESSION_LABELS[session.type]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {confirmed ? (
        <p className="plan-card-confirmed">
          Plan bestätigt — das dauerhafte Speichern folgt in einem separaten
          Schritt.
        </p>
      ) : (
        <div className="plan-card-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => setConfirmed(true)}
          >
            Confirm plan
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={onRequestChange}
          >
            Request a change
          </button>
        </div>
      )}
    </div>
  );
}
