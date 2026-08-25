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
