# Spec 5: Chat-based Plan Adjustment

**Goal:** The user can ask follow-up questions or request adjustments via
chat at any time ("that was too hard," "need to move a week," "my knee is
nagging").

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
