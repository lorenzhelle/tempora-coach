"use client";

import { RULE_CATALOG } from "@tempora/plan-engine";
import type { PlanProposal } from "@/lib/coaching/plan-schema";

type Decision = PlanProposal["trace"][number];

// The "why" reveal (docs/specs/03-onboarding/spec.md): renders the
// engine's own stored trace, grouped by rule, never an LLM-authored
// guess at why a number is what it is. `RULE_CATALOG` (rule text +
// citation) lives in @tempora/plan-engine, not here — this component is
// purely presentational.
export function RuleInfo({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {decisions.map((decision, index) => {
        const entry =
          RULE_CATALOG[decision.ruleId as keyof typeof RULE_CATALOG];
        return (
          <details
            key={`${decision.ruleId}-${decision.targetId}-${index}`}
            className="group rounded-chip border border-border bg-surface-2 px-2.5 py-1.5 text-[12px]"
          >
            <summary className="cursor-pointer list-none font-heading text-text marker:hidden">
              <span className="mr-1 inline-block text-text-muted transition-transform group-open:rotate-90">
                ›
              </span>
              {entry?.title ?? decision.ruleId}
            </summary>
            <div className="mt-1.5 flex flex-col gap-1 pl-3.5 text-text-muted">
              <p className="m-0">{entry?.plain ?? decision.outcome}</p>
              <p className="m-0 font-mono text-[11px]">{decision.outcome}</p>
              {entry && (
                <>
                  <p className="m-0 text-[11px]">{entry.technical}</p>
                  <p className="m-0 text-[11px] italic">{entry.source}</p>
                </>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function decisionsForTarget(
  trace: Decision[],
  targetId: string,
): Decision[] {
  return trace.filter((decision) => decision.targetId === targetId);
}
