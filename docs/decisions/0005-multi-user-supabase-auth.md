# ADR-0005: Multi-user support via Supabase Auth

## Status
Decided — 2026-08-26 (supersedes the "v1 stays single-user" part of
[ARCH-002](../constitution.md), by explicit direction from the project
operator; revises the multi-user bullet under "Out of scope" in
`docs/specs/00-fundament/tickets.md`)

## Context
`docs/constitution.md` (ARCH-002) and `docs/specs/00-fundament/tickets.md`
("Out of scope") deliberately limited v1 to a single user: no signup
flow, no roles/permissions. ADR-0002 already noted the Strava OAuth
architecture is technically multi-user-capable, but treated expanding to
multi-user as "a separate, still-open decision" requiring its own ADR.
The project operator has now made that decision: prepare the app for real
multi-user support, using Supabase (already the Postgres host per
ADR-0004) for authentication too.

This is a distinct Supabase surface from ADR-0004. ADR-0004 is about
Postgres hosting, reached exclusively through Prisma's `@prisma/adapter-pg`
driver adapter — a direct Postgres connection, not through Supabase's
Data API. This ADR is about the managed **Auth** product, reached through
the Supabase JS client (`@supabase/supabase-js`, `@supabase/ssr`), which
manages its own `auth.users` table and issues sessions via cookies.

Options considered:
1. **Supabase Auth.** Already have a Supabase project (ADR-0004); no new
   vendor. Standard email/password + session-cookie flow via
   `@supabase/ssr`, documented Next.js App Router integration.
2. **A custom auth system** (e.g. Auth.js/NextAuth with credentials
   provider, or hand-rolled sessions). More flexibility, but a second
   secrets/session-management surface to build and secure from scratch,
   for no clear benefit over what's already provisioned.
3. **Defer further, stay single-user.** Rejected — the operator has
   decided to prepare for multi-user now.

## Decision
Add **Supabase Auth** (email/password) for user accounts:
- `@supabase/supabase-js` + `@supabase/ssr` for the browser/server clients
  and session-cookie handling (`lib/supabase/`).
- `proxy.ts` at the repo root (Next.js 16's renamed `middleware.ts` —
  the file convention was renamed in v16.0.0, exported function is now
  `proxy`, not `middleware`) refreshes the session cookie on every
  request via `supabase.auth.getUser()`.
- `app/login`, `app/signup` for the sign-in/sign-up forms, and
  `app/auth/callback` as the Route Handler that exchanges an emailed
  confirmation code for a session.
- `app/page.tsx` becomes auth-aware (signed-in vs. signed-out view), as
  the first concrete consumer of the session.

**Important — RLS does not protect Prisma-managed tables.** Supabase's
Auth guidance (and its own security checklist) assumes Row Level Security
policies gate access, keyed off `auth.uid()`, for tables reached through
the Data API (PostgREST) with the `anon`/`authenticated` Postgres roles.
This app's tables are never reached that way — Prisma connects directly
to Postgres via `@prisma/adapter-pg` with its own connection role, which
bypasses RLS entirely. **Authorization for Prisma-managed tables stays an
application-layer concern in Next.js API routes** (already required by
`docs/constitution.md` DATA-001 — mutations only through API routes), not
a Postgres policy. If a table is ever *also* exposed through Supabase's
Data API directly, RLS becomes required for that table (per the
vendored `supabase` skill's checklist) — not applicable to any table
today.

**Why this doesn't make Prisma redundant.** `@supabase/supabase-js` is
used here for Auth only — `signInWithPassword`, `signUp`, `signOut`,
`getUser`, `exchangeCodeForSession`. It never calls `.from(...)` to read
or write app data, so there's no overlapping data-access path to
reconcile with Prisma. Using the Supabase client for app data instead of
Prisma (i.e. PostgREST calls in place of `prisma.plan.findMany()`) was
considered and rejected as a follow-on question: it would force RLS onto
every table (a second, policy-based authorization system next to the
API-route checks DATA-001 already mandates) and make the Spec 2 relational
queries (`Plan → Milestone → TrainingWeek → PlannedSession → Activity`,
the spike-rule lookback) harder to express than Prisma's query builder.
Prisma stays the only path to app data; the Supabase client stays Auth-only.

## Consequences
- `docs/constitution.md` ARCH-002 is revised: multi-user is enabled via
  Supabase Auth; the RLS point above is called out there too so it isn't
  silently assumed later.
- `docs/specs/00-fundament/tickets.md`'s "Out of scope" bullet on
  multi-user is revised to point here instead of deferring; a new ticket
  A4 covers the concrete implementation.
- Still deferred, not part of this decision: per-user data scoping in the
  Prisma schema (a `userId` column referencing `auth.users.id` on
  `Plan`/`Activity`/etc., added per-model when Epic B/C actually create
  those models — unchanged from the existing A2 incremental-schema
  decision), roles/permissions, invite-gating/closed signup, and
  real signup/login Playwright coverage (needs a seeded test account —
  a human/dashboard-only setup step, see the A4 ticket).
- CI: the `e2e` job now depends on a real, reachable Supabase project
  (`proxy.ts` calls Supabase on every request, including the landing
  page) — GitHub repo secrets for the Supabase URL/publishable key are a
  new human-only CI setup step (see ticket A4).
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` join
  `.env.example`; both are publishable-by-design (not secrets per
  `docs/constitution.md` SEC-001, unlike the Strava/AI Gateway
  credentials and the Prisma `DATABASE_URL`/`DIRECT_URL`).

## Related documentation
- Constitution: [docs/constitution.md](../constitution.md) (ARCH-002)
- Architecture: [docs/architecture.md](../architecture.md)
- Foundation setup: [docs/specs/00-fundament/tickets.md](../specs/00-fundament/tickets.md) (ticket A4)
- Database decision: [ADR-0004](0004-datenbank-postgres-supabase.md)
- Strava OAuth (multi-user-capable precedent): [ADR-0002](0002-datenquelle-strava.md)
