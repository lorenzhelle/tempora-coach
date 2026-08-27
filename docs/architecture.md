# Architecture

## Status

Epic A (`00-fundament` tickets A1/A3, and A2 as redefined in
`docs/specs/02-plan-datenmodell/tickets.md`) is implemented: the Next.js
app is scaffolded, Prisma is wired to Postgres, and CI runs
lint/typecheck/build on every PR and push to `main`. The Spec 2 data
model itself is still empty — models are added incrementally as the
epics that consume them (Epic B, Epic C) are implemented, not
front-loaded here (see `docs/specs/02-plan-datenmodell/tickets.md`).
Ticket A4 (Supabase Auth) is also implemented — see
[ADR-0005](decisions/0005-multi-user-supabase-auth.md); still open there:
a real signup/login E2E test (needs a seeded test account) and GitHub
repo secrets for the `e2e` CI job, both human-only steps.
Vercel project creation/connection and the real Supabase/Strava/Anthropic
credentials remain manual, human-only setup steps (no dashboard access
from a coding agent) — see [ADR-0004](decisions/0004-datenbank-postgres-supabase.md).

## System context

Tempora is a single-app web application (not a microservice fleet).
External dependencies:

- **Strava API** (OAuth + webhooks) as the sole data source for running
  activities — see [ADR-0002](decisions/0002-datenquelle-strava.md).
- **Anthropic API (Claude)** for the chat layer (onboarding dialog and
  plan adjustments), including tool use for structured plan updates —
  connected via the Vercel AI SDK, see
  [ADR-0003](decisions/0003-chat-layer-vercel-ai-sdk.md).
- **Postgres, hosted on Supabase**, as the only data store — connected
  via Prisma's `@prisma/adapter-pg` driver adapter (pooled connection at
  runtime, direct connection for migrations). See
  [ADR-0004](decisions/0004-datenbank-postgres-supabase.md) (supersedes
  the earlier local-SQLite assumption).
- **Supabase Auth** for user accounts (email/password), a separate
  Supabase surface from the Postgres hosting above — reached through the
  Supabase JS client (`@supabase/supabase-js`, `@supabase/ssr`), not
  through Prisma. See
  [ADR-0005](decisions/0005-multi-user-supabase-auth.md). Row Level
  Security does not apply to Prisma-managed tables (Prisma bypasses
  PostgREST/RLS via its direct connection) — authorization for those
  stays in API-route code.
  **The Supabase JS client is Auth-only in this app** — `signInWithPassword`,
  `signUp`, `signOut`, `getUser`, `exchangeCodeForSession`. It's never used
  to query `Plan`/`Activity`/etc. (no `.from(...)` calls), so there is no
  overlap with Prisma to resolve. Don't add PostgREST-style data access via
  the Supabase client as an alternative to Prisma: it would require RLS on
  every table — a second authorization system running alongside the
  API-route checks DATA-001 already requires — and would make the Spec 2
  relational queries (`Plan → Milestone → TrainingWeek → PlannedSession →
  Activity`, the spike-rule lookback) harder to express than Prisma's query
  builder. Keep data access on Prisma; keep the Supabase client on Auth.

## Module map

```
repository/
├── app/                    Next.js App Router — UI routes (dashboard, chat, onboarding)
│   ├── login/, signup/     Supabase Auth forms (ADR-0005)
│   ├── auth/callback/      Route Handler exchanging an emailed confirmation code for a session
│   └── api/                Next.js API routes — the only way to mutate plan data
│       ├── strava/oauth/   OAuth connect flow (Spec 1, not yet implemented)
│       ├── strava/webhook/ Webhook endpoint for new activities (Spec 1, not yet implemented)
│       └── chat/           Vercel AI SDK + Anthropic integration, tool definitions
│                           (Spec 3, Spec 5, ADR-0003 — not yet implemented)
├── prisma/                 Schema (currently empty — see "Status" above) + migrations
├── proxy.ts                Next.js 16's renamed `middleware.ts` — refreshes the
│                           Supabase session cookie on every request (ADR-0005)
└── lib/
    ├── prisma.ts           Prisma client singleton
    └── supabase/           Browser/server Supabase clients + the proxy.ts session helper (ADR-0005)
```

Verified against the real structure scaffolded in Epic A: root-level
`app/`, no `src/` directory, Prisma's generated client output lives at
`app/generated/prisma` (gitignored, regenerated via `postinstall`).

## Data model

The plan data model (`Plan`, `Milestone`, `TrainingWeek`, `PlannedSession`,
`Activity`, `StravaConnection`) is fully specified in
[Spec 1](specs/01-strava-sync/spec.md) and
[Spec 2](specs/02-plan-datenmodell/spec.md) — not duplicated here, see
there. As of Epic A, none of these models exist in `prisma/schema.prisma`
yet; see `docs/specs/02-plan-datenmodell/tickets.md` for the incremental,
per-epic rollout.

## Critical flows

1. **Strava sync** (Spec 1): Strava webhook event → API route fetches the
   activity from the Strava API → deduplicates via `stravaActivityId` →
   stores it as an `Activity` → available to the dashboard and chat
   context.
2. **Onboarding** (Spec 3): Chat asks for the key inputs → Claude
   generates a structured plan proposal (JSON) → user confirms → the plan
   is persisted to `Plan`/`Milestone`/`TrainingWeek`/`PlannedSession`.
3. **Chat-based adjustment** (Spec 5): User request in chat → Claude gets
   the current plan state + recent activities as context → identifies the
   affected field → checks it against training principles (spike rule,
   see `docs/research/`) → changes it in a targeted way, warns on a
   violation instead of silently applying it.

## Cross-cutting concerns

- **Consistency:** Plan mutations run exclusively through API routes,
  never directly from frontend code (see `docs/constitution.md`
  DATA-001).
- **Security:** Strava tokens are kept encrypted/server-side, never in
  client code or logs (see `docs/constitution.md` SEC-001). User sessions
  are managed by Supabase Auth via cookies (`proxy.ts`); Row Level
  Security does not gate Prisma-managed tables — authorization for those
  is enforced in API-route code (see `docs/constitution.md` ARCH-002,
  ADR-0005).
- **Resilience:** Strava sync via webhooks with a periodic fallback
  reconciliation (ticket B4), so lost webhook events don't lead to
  missing activities.
- **Deployment/CI:** push to `main` → Vercel git integration auto-builds
  a **Preview** deployment (`vercel.json` only enables git-triggered
  builds for `main`; PRs get none) → GitHub Actions runs `ci`
  (lint/typecheck/build) then `e2e` → only once both pass does a
  `promote-production` job call the Vercel API to promote that build to
  Production. See [ticket A3](specs/00-fundament/tickets.md).

## ADR index

Binding architecture decisions live as ADRs in
[docs/decisions/](decisions/README.md):

- [ADR-0001](decisions/0001-app-name-tempora.md) — App name: Tempora
- [ADR-0002](decisions/0002-datenquelle-strava.md) — Data source: Strava
  instead of a direct Garmin sync
- [ADR-0003](decisions/0003-chat-layer-vercel-ai-sdk.md) — Chat layer
  implementation: Vercel AI SDK
- [ADR-0004](decisions/0004-datenbank-postgres-supabase.md) — Database:
  Postgres on Supabase instead of local SQLite
- [ADR-0005](decisions/0005-multi-user-supabase-auth.md) — Multi-user
  support via Supabase Auth

## Related documentation

- Agent instructions: [AGENTS.md](../AGENTS.md)
- Invariants: [docs/constitution.md](constitution.md)
- Operations: [docs/runbooks/runbook.md](runbooks/runbook.md)
- Feature specs: [docs/specs/](specs/README.md)
- Design system: [docs/design-system.md](design-system.md)

## Maintenance

Update once the tickets under `docs/specs/` are implemented and the real
structure diverges from the plan described here, and on every new
architecture ADR.
