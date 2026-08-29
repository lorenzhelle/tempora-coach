# ADR-0008: Full-horizon plan generation via a deterministic progression algorithm

## Status
Decided — 2026-08-28 (revises the former invariant
DATA-003; revises [Spec 2](../specs/02-plan-datenmodell/spec.md) and
[Spec 3](../specs/03-onboarding/spec.md); extends
[Spec 5](../specs/05-chat-anpassung/spec.md))

## Context
The shipped onboarding chat (tickets C1/C2) only ever produces `week1` in
full detail — `planProposalSchema` (`lib/coaching/plan-schema.ts`) has a
hard-coded `week1` field (`weekNumber: z.literal(1)`), not an array of
weeks, and the system prompt explicitly tells Claude *"Week 1 must be
planned in full detail … Later phases are only roughly sketched (a week
count and a one-phrase focus each)."* The rest of the ~10-month journey to
the goal exists only as `phases: { phase, weekCount, focus }[]` — no
dates, no sessions. This was never a considered decision; it fell out of
routing everything through a single `streamText`/`proposePlan` tool call,
and nowhere in `docs/specs/` or `docs/research/` is it said that the plan
*should* stop at week 1.

A design review (see conversation history) worked through what "the whole
plan" should actually mean, given:
- `docs/research/progression-und-verletzungspraevention.md` has concrete,
  literature-backed numeric rules (3:1 step-loading with a 10–40% deload,
  a 6-month mileage progression table, the RUNSAFE single-session spike
  rule) that are clearly meant to be applied consistently, not re-derived
  by an LLM on every call.
- `docs/research/onboarding-und-trainingsmethodik.md` recommends keeping
  phase boundaries adaptive to progress rather than a fixed calendar, and
  re-testing every 4–6 weeks — in tension with committing to a full
  calendar upfront, resolved below via the replanning concept.
- The former invariant DATA-003 said a chat-based
  adjustment "never regenerates the entire plan" — too strict once a
  legitimate full reset (e.g. after an illness) is wanted.
- The onboarding chat currently never asks which days the user can train,
  yet `PlannedSession.dayOfWeek` is a required field the LLM must invent
  with zero guidance; and no workout type is ever explained to the user.

## Decision

**Horizon & generation**
1. The plan is generated for the full horizon at onboarding time, capped
   at **12 months** from `Plan.startDate`. If the user's goal target date
   is further out, onboarding rejects/clamps it — the user is asked to
   pick a nearer intermediate goal instead of a `Plan` beyond that
   horizon.
2. Every week in that horizon gets full day-by-day `PlannedSession`
   detail from creation, not just a summary. This is only feasible
   because generation is moving off a single LLM tool-call payload (see
   next point) — a ~50-week, full-detail plan would be an unreasonably
   large `proposePlan` output otherwise.
3. A **deterministic algorithm** (new module; exact location/API is an
   implementation ticket, not settled here) encodes the research's
   progression rules — 3:1 step-loading + 10–40% deload weeks, the
   6-month mileage table, the RUNSAFE spike-rule ceiling — and computes
   phase placement, weekly volume, deload-week placement, and day-by-day
   session structure (type, duration, distance, pace, day-of-week) for
   the whole horizon.
4. The LLM's role shrinks accordingly: during onboarding it only elicits
   the user's goal/constraints (see intake additions below), and it
   writes free-text prose — phase `focus` copy and per-session
   `description` — within the structure the algorithm already fixed. It
   never invents progression numbers or day assignments itself.

**Onboarding intake additions**
5. Alongside the existing four topics (safety screening, training
   history, goal, day-count time budget), onboarding now also asks:
   - the user's **preferred long-run day** (not a full day-of-week set —
     the algorithm places the rest);
   - **schedule regularity** (predictable free days vs. irregular/shift
     work);
   - **gym/strength access**, since `strength` is already a session type
     and this directly determines whether the algorithm schedules a real
     gym session or substitutes a bodyweight-only routine;
   - **age, height, weight** — for injury-risk stratification (a high
     BMI combined with prior running complaints is flagged in a RUNSAFE
     sub-study, Lindman et al. 2025), a different rationale from the
     already-excluded HR-zone data. Resting heart rate and sleep/stress
     stay excluded, per the existing prompt's design.

   Terrain, watch ownership, and shoe condition stay excluded — per the
   research doc's own principle ("every question must have a consequence
   in the plan"), none of them currently feed anything in the schema or
   algorithm.

**Day-of-week assignment**
6. The algorithm assigns a default day-per-session pattern for everyone,
   respecting the stated long-run day. For an irregular schedule, the
   same default assignment still happens, but the UI/copy frames it as a
   flexible suggestion rather than a fixed commitment. A separate,
   lower-level capability for manually shifting individual sessions is
   explicitly out of scope here (see "Deferred" below).

**Explaining workouts**
7. The plan card renders the already-generated (currently discarded)
   per-session `description`, plus a small static, always-accurate
   one-line-per-type legend (six fixed session types — no LLM variance).
   The coach also gives one brief explanatory paragraph in chat when
   first proposing the plan. The pain-traffic-light model and its
   bone-pain exception are **not** explained to the user in this pass —
   applied silently as today, deferred (see "Deferred" below).

**Replanning**
8. A **full replan** is introduced as a distinct operation from a
   targeted chat edit (Spec 5, AC 1): it re-runs the deterministic
   algorithm over all **not-yet-completed** weeks/sessions using updated
   inputs (actual completed volume, a reported life event such as
   illness or a missed block), and never modifies a `TrainingWeek` or
   `PlannedSession` already marked `completed`.
   - **During onboarding**, replanning the still-unconfirmed draft
     applies directly — no extra confirm step; "Confirm plan" remains the
     one gate.
   - **Post-onboarding**, once a plan is live and confirmed (Spec 5, main
     dashboard), a full replan requires an explicit confirm step before
     applying — the same propose → confirm/request-change pattern as
     onboarding, consistent with SAFE-001/SAFE-002 (flag before applying,
     don't silently apply).

## Deferred (explicitly out of scope for this decision)
- **Taper.** No taper is documented anywhere in `docs/research/`; the
  "race" phase gets no special end-of-plan volume reduction yet. Flagged
  as a research gap for a future pass.
- **Age/BMI rule.** Age/height/weight are collected (point 5 above) but
  wired into no rule yet — there's a single cited correlation, not a
  documented threshold. Collect and store only; revisit once researched.
- **Traffic-light explanation.** Not explained to the user at all in this
  pass, including the bone-pain exception — deferred to a future ticket
  (likely the first post-run check-in, not onboarding).
- **Manual session shifting.** A surgical, non-replan way to move a
  single session (main dashboard) stays a separate, later ticket.

## Consequences
- The former invariant **DATA-003** is revised: a full
  replan (point 8 above) is the one sanctioned exception to "never
  regenerate the whole plan." Ad-hoc targeted chat edits (Spec 5, AC 1,
  ticket E2) remain
  constrained exactly as before — this ADR narrows what counts as
  "regenerating the entire plan," it doesn't loosen it for ordinary
  edits.
- `docs/specs/02-plan-datenmodell/spec.md`: `Plan` gains onboarding-intake
  fields (`longRunDay`, `scheduleRegularity`, `gymAccess`, `ageYears`,
  `heightCm`, `weightKg`); the plan-creation AC is revised from
  "`TrainingWeek` entries for the current phase" to "the full horizon
  (capped at 12 months)"; a new AC covers full-replan behavior
  (not-yet-completed rows only).
- `docs/specs/03-onboarding/spec.md`: Flow step 1 gains the new intake
  topics; Flow step 2 and the "Plan proposal" design bullet describe the
  full-horizon, algorithm-backed proposal instead of "week 1 in detail,
  later phases sketched"; a new AC covers the 12-month cap.
- `docs/specs/05-chat-anpassung/spec.md`: gains the full-replan concept
  and its post-onboarding confirm-gate requirement.
- No code changes ship with this ADR. New implementation tickets are
  needed for: the progression-algorithm module itself, the 12-month cap
  validation, the plan-card UI (week switcher, legend, description
  rendering), and the full-replan mechanism (including the confirm-gate
  UI). This ADR only settles the design those tickets implement.

## Related documentation
- Rules and conventions: [docs/rules.md](../rules.md)
- Data model: [Spec 2](../specs/02-plan-datenmodell/spec.md)
- Onboarding: [Spec 3](../specs/03-onboarding/spec.md)
- Chat-based adjustment: [Spec 5](../specs/05-chat-anpassung/spec.md)
- Research: `docs/research/progression-und-verletzungspraevention.md`,
  `docs/research/onboarding-und-trainingsmethodik.md`
- Chat layer / plan-proposal tool call:
  [ADR-0003](0003-chat-layer-vercel-ai-sdk.md)
