# Plan Data Model — Tickets

Builds on [00-fundament](../00-fundament/tickets.md). See [spec.md](spec.md)
for the goal and acceptance criteria.

### A2 — Create the data model (Spec 2) — introduced incrementally

**Decision (Epic A):** the full Spec 2 model set is *not* created in one
shot. Instead each model is added to `prisma/schema.prisma` in the epic
that actually consumes it, so the schema never carries models with no
code exercising them yet:

- `Activity` → added with Epic B / [Spec 1](../01-strava-sync/spec.md)
  (Strava sync).
- `Plan`, `Milestone`, `TrainingWeek`, `PlannedSession` → added with
  Epic C / [Spec 3](../03-onboarding/spec.md) (onboarding — the flow that
  actually creates a `Plan`).

What Epic A itself delivers: the Prisma↔Postgres wiring (datasource,
migration tooling, driver adapter) working end-to-end against an empty
schema — see `docs/specs/00-fundament/tickets.md` ticket A1 and
[ADR-0004](../../decisions/0004-datenbank-postgres-supabase.md). There is
no separate migration to run for A2 in Epic A.

- **Acceptance (revised):** `prisma migrate dev` runs cleanly against the
  Supabase Postgres database with zero models. Per-model acceptance (all
  Spec 2 models exist as tables, `PlannedSession.linkedActivityId` →
  `Activity` relation works) is verified when each model is actually
  added, in Epic B/C respectively — not here.
