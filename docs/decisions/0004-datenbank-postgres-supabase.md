# ADR-0004: Database — Postgres on Supabase instead of local SQLite

## Status
Decided — 2026-08-25 (supersedes the "SQLite as the only data store (no
external DB server for v1)" line in `docs/architecture.md`)

## Context
`docs/architecture.md` originally assumed a local SQLite file as the only
data store for v1, on the reasoning that a single-user app doesn't need a
hosted DB server. Implementing Epic A (ticket A1, project setup) surfaced
a real problem with that: Vercel's deployed serverless functions have an
ephemeral filesystem outside `/tmp`, and `/tmp` isn't shared across
function instances or persisted across invocations/deployments. A
file-based `DATABASE_URL` (e.g. `file:./dev.db`) works for local dev but
never durably persists writes once deployed to Vercel — the app would
appear to work, then silently lose data. Ticket A3's own text ("Store
secrets... DB connection... as Vercel environment variables") already
implied a connection-string-style database, which is in tension with a
local file.

Options considered:

1. **Keep local SQLite, add a hosted libSQL/Turso database for
   production only.** Keeps SQLite semantics via Prisma's driver
   adapters, smallest schema diff. Downside: two different DB engines
   between local dev and production is an extra source of drift, and
   Turso-specific quirks would only surface in prod.
2. **Postgres, hosted on Supabase, used for both local dev and
   production.** One engine everywhere, no local/prod drift. Standard,
   well-documented Prisma integration (driver adapter `@prisma/adapter-pg`
   + pooled/direct connection strings). Requires a Supabase account
   (human-only setup step, outside this agent's reach) and an external
   network dependency even for local development (no more fully offline
   dev loop).
3. **Postgres, hosted elsewhere (Neon, Railway, self-hosted).** Similar
   trade-offs to option 2; Supabase chosen specifically per direction
   from the project operator.

## Decision
The database is **Postgres, hosted on Supabase**, used for both local
development and production — no local SQLite file anywhere in the stack.

- Prisma's `postgresql` provider, connected via the `@prisma/adapter-pg`
  driver adapter at runtime (`lib/prisma.ts`).
- Two connection strings, per Supabase's documented pooled/direct split
  (Supabase's pgbouncer transaction pooler doesn't support the prepared
  statements Prisma Migrate needs):
  - `DATABASE_URL` — pooled connection (port 6543), used by the app's
    `PrismaClient` at runtime.
  - `DIRECT_URL` — direct connection (port 5432), used by the Prisma CLI
    (`prisma migrate`, `prisma studio`) via `prisma7.config.ts`.
- Both are required from local dev onward — there is no SQLite fallback
  for offline work.

## Consequences
- `docs/architecture.md`'s "System context" data-store line needs
  updating from "SQLite as the only data store" to Postgres/Supabase.
- Local development now requires a real, reachable Supabase project —
  the previously fully-offline dev loop (`prisma migrate dev` against a
  local file) no longer applies. Creating the Supabase project and
  obtaining its connection strings is a human-only setup step (this
  agent has no browser/dashboard access), and now blocks A1/A2's DB
  verification steps, not just A3's deploy step.
- Resolves the Vercel-persistence problem described in Context — writes
  now durably persist through a real hosted Postgres instance instead of
  an ephemeral local file.
- `Activity.stravaActivityId` (ADR-0002) and the rest of the Spec 2 data
  model are unaffected in shape — only the underlying engine changes,
  from SQLite's dialect to Postgres's.
- Ongoing cost/quota: subject to Supabase's free-tier limits unless a
  paid plan is chosen later — not evaluated in this ADR, left to the
  operator when setting up the Supabase project.

## Related documentation
- Architecture: [docs/architecture.md](../architecture.md)
- Foundation setup: [docs/specs/00-fundament/tickets.md](../specs/00-fundament/tickets.md)
- Plan data model: [docs/specs/02-plan-datenmodell/spec.md](../specs/02-plan-datenmodell/spec.md)
