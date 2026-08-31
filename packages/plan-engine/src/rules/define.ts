// The tracing primitive. This is what makes the engine's transparency
// structural rather than a discipline: a rule's value can only be obtained
// by running it through a Tracer, which records the Decision that produced
// it. See docs/research/designing-a-plan-generator.md §4 ("Making the
// output explainable in the UI") for why this matters — without it, the
// agent's explanation of a plan drifts from the computation that actually
// produced it.

import type { Decision, DecisionScope, PipelineStep, RuleId } from "../types";

export type RuleResult<TValue> = {
  value: TValue;
  /** What went into this decision — rendered alongside `outcome` in the UI's expanded view. */
  inputs: Record<string, number | string | boolean>;
  /** A short human-readable summary of what came out, e.g. "12 → 14 km". */
  outcome: string;
};

export type RuleDefinition<TInput, TValue> = {
  id: RuleId;
  step: PipelineStep;
  apply: (input: TInput) => RuleResult<TValue>;
};

/** Declares a rule. A thin identity wrapper that exists purely to anchor the generic inference at the call site. */
export function defineRule<TInput, TValue>(
  definition: RuleDefinition<TInput, TValue>,
): RuleDefinition<TInput, TValue> {
  return definition;
}

export type TraceTarget = {
  scope: DecisionScope;
  /** e.g. 'plan', 'week-7', 'week-7:tuesday' */
  targetId: string;
};

/**
 * Runs a rule against a target and records the Decision it produced. This
 * is the only way to get a value out of a rule — you cannot compute a
 * number without emitting the trace entry that explains it.
 */
export class Tracer {
  private readonly decisions: Decision[] = [];

  run<TInput, TValue>(
    rule: RuleDefinition<TInput, TValue>,
    input: TInput,
    target: TraceTarget,
  ): TValue {
    const { value, inputs, outcome } = rule.apply(input);
    this.decisions.push({
      step: rule.step,
      scope: target.scope,
      targetId: target.targetId,
      ruleId: rule.id,
      inputs,
      outcome,
      value,
    });
    return value;
  }

  /** The full trace recorded so far, in the order rules were run. */
  all(): Decision[] {
    return [...this.decisions];
  }
}
