# Plan Data Model — Tickets

Builds on [00-fundament](../00-fundament/tickets.md). See [spec.md](spec.md)
for the goal and acceptance criteria.

### A2 — Create the data model (Spec 2)
- Prisma schema for `Plan`, `Milestone`, `TrainingWeek`, `PlannedSession`,
  `Activity` per Spec 2
- Generate the migration and test it locally
- **Acceptance:** all models from Spec 2 exist as tables, relations work
  (e.g. `PlannedSession.linkedActivityId` → `Activity`)
