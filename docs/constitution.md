# Constitution

Non-negotiable invariants for Tempora. These rules stand above `AGENTS.md`
conventions and may only be changed through a new, explicit decision (an
ADR in `docs/decisions/`) — never silently via a code change.

## Security

- **SEC-001** — Strava access/refresh tokens, the AI Gateway API key
  (see [ADR-0006](decisions/0006-vercel-ai-gateway.md)), and all other
  secrets must never end up in the Git repository (code, config,
  logs, commit history). They live exclusively in `.env` (local) or in the
  hosting platform's secret mechanisms (Vercel environment variables).
- **SEC-002** — Strava access tokens expire after 6h. The refresh must
  happen automatically and proactively (before expiry), not reactively
  only once an API call fails (see `docs/specs/01-strava-sync/spec.md`
  Spec 1, AC 4).
- **SEC-003** — If a refresh token becomes invalid (the user revoked
  access in Strava), the connection MUST be marked as disconnected; the
  error must not block other syncs (see
  `docs/specs/01-strava-sync/spec.md` Spec 1, AC 5).

## Data integrity

- **DATA-001** — The training plan is a structured data model in the DB
  (`Plan`, `Milestone`, `TrainingWeek`, `PlannedSession`), not just text in
  the chat history. Mutations run exclusively through Next.js API routes —
  never directly from frontend code or unchecked from a chat response.
- **DATA-002** — Strava activities are deduplicated via
  `stravaActivityId`. A repeated sync run or a duplicate webhook event must
  never produce duplicate `Activity` entries (see
  `docs/specs/01-strava-sync/spec.md` Spec 1, AC 3).
- **DATA-003** — A targeted chat-based adjustment changes only the
  affected fields of a plan, never regenerates the entire plan (see
  `docs/specs/05-chat-anpassung/spec.md` Spec 5, AC 1). This prevents
  already-confirmed parts of the plan from being overwritten
  unintentionally. The one sanctioned exception is a **full replan** (see
  [ADR-0008](decisions/0008-full-horizon-deterministic-plan-generation.md)):
  a distinct, explicit operation that re-runs the deterministic
  progression algorithm over all not-yet-completed `TrainingWeek`/
  `PlannedSession` rows given updated inputs (e.g. an illness or a missed
  block) — it must never modify a row already marked `completed`, and
  outside onboarding it requires explicit user confirmation before
  applying (see SAFE-001/SAFE-002 below). Ordinary targeted edits stay
  exactly as constrained as before.

## Architecture boundaries

- **ARCH-001** — The data source for running activities is Strava (OAuth +
  webhooks), no more Garmin direct-sync sidecar (see
  [ADR-0002](decisions/0002-datenquelle-strava.md)). Changing the data
  source requires a new ADR that explicitly supersedes ADR-0002.
- **ARCH-002** — Multi-user support is enabled via Supabase Auth (see
  [ADR-0005](decisions/0005-multi-user-supabase-auth.md)), which
  supersedes the earlier single-user-only limitation. Row Level Security
  does **not** protect Prisma-managed tables — Prisma connects directly
  to Postgres via `@prisma/adapter-pg`, bypassing PostgREST/RLS entirely;
  authorization for those tables stays an application-layer concern in
  API routes (see DATA-001), not a Postgres policy. Per-user data scoping
  in the schema itself, roles/permissions, and invite-gating remain
  separate, still-open decisions (see ADR-0005 "Consequences").

## Training principles (domain safety rules)

- **SAFE-001** — A chat request that plans a single run that jumps sharply
  above the longest run of the last 30 days (RUNSAFE spike rule, see
  `docs/research/`) must not be silently applied. The system MUST flag it
  first, before applying the change (see
  `docs/specs/05-chat-anpassung/spec.md` Spec 5, AC 4).
- **SAFE-002** — Localized bone pain (shin/foot/hip) does not follow the
  normal pain-traffic-light logic (0–10 scale) — it is always a stop
  signal for impact loading, regardless of the numeric value (see
  `docs/research/progression-und-verletzungspraevention.md`).

## Human vs. agent approval gates

- Human approval required before: merging into the default branch, any
  destructive git operation (force-push, reset --hard), any schema
  migration affecting existing data, any change of data source or the
  multi-user decision (see ARCH-001/ARCH-002).
- A coding agent may, without asking first: implement code per the
  specs/tickets under `docs/specs/`, write/run tests, update documentation
  per this context layer.

## Governance metadata

- Owner: `[NEEDS CONFIRMATION: formal owner — currently the sole
  user/operator of the project]`
- Last reviewed: 2026-08-28
- Change process: An invariant is only changed through a new ADR, never
  through a silent code or doc change.

## Related documentation

- Agent instructions: [AGENTS.md](../AGENTS.md)
- Architecture: [docs/architecture.md](architecture.md)
- Decision history: [docs/decisions/README.md](decisions/README.md)

## Maintenance

Review whenever security, data-integrity, or architecture boundaries
change — every change goes through a new ADR, never a direct edit of
existing invariant IDs.
