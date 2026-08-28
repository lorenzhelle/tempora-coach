# Chat-based Adjustment — Tickets

Builds on [03-onboarding](../03-onboarding/tickets.md). See
[spec.md](spec.md) for the goal and acceptance criteria.

### E1 — Plan context in chat requests
- The existing chat (from C2) gets the current plan state + the last N
  activities as tool results on every request
- **Acceptance:** Claude can correctly reference specific weeks/sessions
  of the existing plan in chat

### E2 — Targeted plan updates
- A tool for Claude to change individual fields (e.g. move a
  `PlannedSession`, adjust a `TrainingWeek`) instead of regenerating the
  whole plan (Spec 5, AC 1)
- **Acceptance:** the chat request "move Sunday's run to Monday" changes
  only the affected field, the rest of the plan stays unchanged

### E3 — Training-principles check
- Before applying a change: check it against simple rules (spike rule: a
  single run doesn't jump sharply above the longest run of the last 30
  days; see `docs/research/`), warn instead of silently applying on a
  violation (Spec 5, AC 4)
- **Acceptance:** a request for an unrealistic jump in distance triggers a
  notice in chat before anything is changed

### E4 — Full replan
- A tool for Claude to trigger a full replan instead of a targeted edit
  (E2), for requests like "I was sick for a week" — calls the same
  progression algorithm as onboarding
  ([ticket C4](../03-onboarding/tickets.md)) over the not-yet-completed
  `TrainingWeek`/`PlannedSession` rows, given updated inputs (completed
  volume so far, the reported gap/event)
  ([ADR-0008](../../decisions/0008-full-horizon-deterministic-plan-generation.md))
- Rows already marked `completed` are never touched
- Unlike onboarding (where a replan of the unconfirmed draft applies
  directly), the recomputed remaining plan is presented in chat for
  explicit confirmation before it's written to the DB — same
  propose/confirm pattern as the initial plan card (Spec 5, new AC)
- Out of scope here: a surgical "move one session" capability that
  doesn't involve a full replan — deferred to a future dashboard-editing
  ticket
- **Acceptance:** a chat message describing an illness/gap produces a
  confirmable replan proposal that leaves completed sessions untouched;
  nothing is persisted until the user confirms
