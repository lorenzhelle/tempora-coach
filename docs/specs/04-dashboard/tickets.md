# Dashboard — Tickets

Builds on [00-fundament](../00-fundament/tickets.md) and
[02-plan-datenmodell](../02-plan-datenmodell/tickets.md). See
[spec.md](spec.md) for the goal and acceptance criteria.

### D1 — Week overview
- A view that loads the current `TrainingWeek` (based on today's date)
  and shows all `PlannedSession` entries
- **Acceptance:** the correct week is determined from the date (Spec 4,
  AC 1)

### D2 — Next session + status
- Highlight the next open session
- Automatic "missed" marking for past sessions without a linked activity
  (Spec 4, AC 2)
- **Acceptance:** manually create a past session without an activity in
  the DB → it's shown as missed

### D3 — Milestone progress + history chart
- Display: current personal best vs. next milestone
- A simple pace-trend chart of recent activities
- **Acceptance:** the chart shows real data from `Activity`, updates
  after a new sync (Spec 4, AC 3)
