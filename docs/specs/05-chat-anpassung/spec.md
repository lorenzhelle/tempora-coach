# Spec 5: Chat-based Plan Adjustment

**Goal:** The user can ask follow-up questions or request adjustments via
chat at any time ("that was too hard," "need to move a week," "my knee is
nagging").

**Targeted edits vs. full replan:** most requests are targeted — change
one field, leave the rest alone (AC 1). Some requests instead warrant a
**full replan** — re-running the deterministic progression algorithm
(Spec 2, ADR-0008) over the not-yet-completed part of the plan given
updated inputs, e.g. "I was sick for a week" or a reported extended gap.
The agent decides which kind of change a request needs; a full replan
never modifies a `TrainingWeek`/`PlannedSession` already marked
`completed`, and — unlike during onboarding, where a replan of the
still-unconfirmed draft applies directly — a full replan here requires an
explicit confirm step before applying (see AC below;
[ADR-0008](../../decisions/0008-full-horizon-deterministic-plan-generation.md),
[DATA-003](../../constitution.md#data-integrity)). A separate, more
surgical capability for manually moving a single session without a full
replan is out of scope here — deferred to a future dashboard-editing
ticket.

**Context Claude gets per request:**
- The current plan state (JSON, [Spec 2](../02-plan-datenmodell/spec.md))
- The last N activities ([Spec 1](../01-strava-sync/spec.md))
- A system prompt with the coaching logic (training principles, see
  `docs/research/` — especially the pain-traffic-light model and the
  RUNSAFE spike rule for safety checks)

**Acceptance Criteria:**
- WHEN the user requests an adjustment in chat, THE SYSTEM SHALL identify
  the relevant part of the plan and change it in a targeted way (not
  rewrite the whole plan).
- WHEN a plan change has been made, THE SYSTEM SHALL make it visible on
  the dashboard immediately.
- IF the request is just a question (no change wanted), THEN THE SYSTEM
  SHALL answer without changing the plan.
- WHEN a requested adjustment contradicts the training principles (e.g. a
  single run that jumps sharply above the longest run of the last 30
  days — see the RUNSAFE finding in `docs/research/`), THEN THE SYSTEM
  SHALL flag it before applying the change.
- WHEN the agent determines a request warrants a full replan (not a
  targeted edit), THE SYSTEM SHALL present the recomputed remaining plan
  for explicit confirmation before applying it — never apply a full
  replan silently.
- A full replan SHALL never modify a `TrainingWeek` or `PlannedSession`
  already marked `completed`.
