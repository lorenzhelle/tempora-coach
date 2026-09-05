# Research

Primary-source research that grounds the coaching logic in
[Spec 3](../specs/03-onboarding/spec.md) (onboarding) and
[Spec 5](../specs/05-chat-anpassung/spec.md) (chat-based adjustment). Not
code — a reference for system prompts and plan rules.

- `progression-und-verletzungspraevention.md` — safe mileage build-up
  (the 10% rule vs. the RUNSAFE spike rule), the pain-traffic-light model,
  an assessment checklist (PAR-Q+), a concrete example progression plan
  (the 6-month mileage table `packages/plan-engine`'s volume curve is
  regression-tested against).
- `onboarding-und-trainingsmethodik.md` — training methodology (80/20,
  interval lengths), a source overview with key findings, plus the
  6-phase onboarding conversation concept with its derivation logic
  (answer combination → plan consequence).
- `designing-a-plan-generator.md` — the deterministic-generator design
  this repo actually implements: VDOT via the Daniels-Gilbert equations,
  the per-zone pace derivation, the full computation pipeline (fitness →
  paces → feasibility → phases → volume curve → weekly allocation → day
  placement → session prescription → validation), the taper rule (Bosquet
  et al. 2007), and the explainability design (a "why" reveal driven by a
  stored rule trace, not an LLM-authored guess) — see
  [ADR-0009](../decisions/0009-plan-engine-package.md) and
  `packages/plan-engine`.
- `5k-plans-comparison-and-adaptive-volume.md` — a cross-plan comparison
  of published 5K programs (beginner/finisher, time-goal, elite
  methodology) and why there's no formula for an individual's "correct"
  weekly volume — only a minimum effective dose that periodic time-trial
  re-testing should reveal. This is the basis for `volume.target_cap`
  (`packages/plan-engine/src/rules/volume.ts`) holding the target-volume
  climb at current volume once a recent time trial already shows the
  goal on track, instead of always climbing toward the generic
  by-distance heuristic.

**Core rule for the plan logic (Spec 5, AC 4):** The best-evidenced risk
factor isn't the weekly volume increase, but a single run that
significantly exceeds the longest distance of the last 30 days (Frandsen
et al./RUNSAFE, *BJSM* 2025). That's the safety check the app should
actually automate — not a rigid 10%-per-week rule, which showed no
protective effect in the only RCT on the topic (Buist et al. 2008).
