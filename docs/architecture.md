# Architecture

## Status

Foundation setup (Next.js scaffold, Prisma↔Postgres wiring, CI) is
implemented: the Next.js app is scaffolded, Prisma is wired to Postgres,
and CI runs lint/typecheck/build on every PR and push to `main`. The Spec
2 data model itself is still empty — models are added incrementally as
the specs that consume them (Spec 1, Spec 3) are implemented, not
front-loaded here (see "Data model" below). Supabase Auth is also
implemented — see
[ADR-0005](decisions/0005-multi-user-supabase-auth.md); still open there:
a real signup/login E2E test (needs a seeded test account) and GitHub
repo secrets for the `e2e` CI job, both human-only steps.
Vercel project creation/connection and the real Supabase/Strava/AI
Gateway credentials remain manual, human-only setup steps (no dashboard
access from a coding agent) — see [ADR-0004](decisions/0004-datenbank-postgres-supabase.md).

## System context

Tempora is a single-app web application (not a microservice fleet).
External dependencies:

- **Strava API** (OAuth + webhooks) as the sole data source for running
  activities — see [ADR-0002](decisions/0002-datenquelle-strava.md).
- **Claude, via Vercel AI Gateway,** for the chat layer (onboarding
  dialog and plan adjustments), including tool use for structured plan
  updates — connected via the Vercel AI SDK (`streamText`, a plain
  `"anthropic/claude-sonnet-5"` model-id string, no direct Anthropic
  provider package), see
  [ADR-0003](decisions/0003-chat-layer-vercel-ai-sdk.md) and
  [ADR-0006](decisions/0006-vercel-ai-gateway.md).
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
  API-route-only mutation rule below — and would make the Spec 2
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
│       └── chat/           Vercel AI SDK, Claude via AI Gateway, tool definitions
│                           (Spec 3, Spec 5, ADR-0003, ADR-0006)
├── prisma/                 Schema (currently empty — see "Status" above) + migrations
├── proxy.ts                Next.js 16's renamed `middleware.ts` — refreshes the
│                           Supabase session cookie on every request (ADR-0005)
├── packages/               Framework-agnostic logic, npm workspaces (not `lib/`)
│   └── plan-engine/        @tempora/plan-engine — fitness index, training paces,
│                           progression/volume/allocation rules. Pure, no DB/
│                           network/clock access. Vitest-tested (ADR-0009).
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
there. None of these models exist in `prisma/schema.prisma` yet. They are
deliberately not created in one shot; each is added when the spec that
actually consumes it is implemented, so the schema never carries a model
with no code exercising it: `Activity` with Spec 1 (Strava sync); `Plan`,
`Milestone`, `TrainingWeek`, `PlannedSession` with Spec 3 (onboarding —
the flow that actually creates a `Plan`), including the onboarding-intake
fields on `Plan` (see [Spec 2](specs/02-plan-datenmodell/spec.md)).

## Critical flows

1. **Strava sync** (Spec 1): Strava webhook event → API route fetches the
   activity from the Strava API → deduplicates via `stravaActivityId` →
   stores it as an `Activity` → available to the dashboard and chat
   context.
2. **Onboarding** (Spec 3): Chat asks for the key inputs (including day/
   time-budget and risk-stratification questions the onboarding intake
   requires — see Spec 3) → `packages/plan-engine`'s `generatePlan()`
   computes the full plan for the whole horizon (capped at 12 months),
   Claude only writes the free-text phase/session prose within that
   structure → user confirms → the plan is persisted to
   `Plan`/`Milestone`/`TrainingWeek`/`PlannedSession` for the full
   horizon.
3. **Chat-based adjustment** (Spec 5): User request in chat → Claude gets
   the current plan state + recent activities as context → either
   identifies the affected field and changes it in a targeted way, or —
   for a full replan — re-runs `generatePlan()` over the not-yet-completed
   part of the plan; checks either kind of change
   against training principles (spike rule, see `docs/research/`) and
   warns on a violation instead of silently applying it; a replan outside
   onboarding additionally requires explicit confirmation before applying.

## Cross-cutting concerns

- **Consistency:** Plan mutations run exclusively through API routes,
  never directly from frontend code.
- **Security:** Strava tokens are kept encrypted/server-side, never in
  client code or logs. User sessions are managed by Supabase Auth via
  cookies (`proxy.ts`); Row Level Security does not gate Prisma-managed
  tables — authorization for those is enforced in API-route code (see
  ADR-0005).
- **Resilience:** Strava sync via webhooks with a periodic fallback
  reconciliation (ticket B4), so lost webhook events don't lead to
  missing activities.
- **Deployment/CI:** push to `main` → Vercel git integration auto-builds
  a **Preview** deployment (`vercel.json` only enables git-triggered
  builds for `main`; PRs get none) → GitHub Actions runs `ci`
  (lint/typecheck/build) then `e2e` → only once both pass does a
  `promote-production` job call the Vercel API to promote that build to
  Production.

## ADR index

Binding architecture decisions live as ADRs, indexed in
[docs/decisions/README.md](decisions/README.md) — not duplicated here.

## Related documentation

- Agent instructions: [AGENTS.md](../AGENTS.md)
- Operations: [docs/runbooks/runbook.md](runbooks/runbook.md)
- Feature specs: [docs/specs/](specs/README.md)
- Design system: [docs/design-system.md](design-system.md)

## Maintenance

Update once the tickets under `docs/specs/` are implemented and the real
structure diverges from the plan described here, and on every new
architecture ADR.
