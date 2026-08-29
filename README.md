# Tempora

Tempora is a web app for a structured running training plan (current
goal: 5 km under 20 minutes). It syncs running activities via Strava (see
[ADR-0002](docs/decisions/0002-datenquelle-strava.md)), keeps the training
plan as a structured data model instead of just text, shows it in a
dashboard, and allows adjustments through a chat layer.



## Prerequisites and setup

- Prerequisites: Node.js 22 (see `.nvmrc`), npm, a
  [Supabase](https://supabase.com) Postgres project (see
  [ADR-0004](docs/decisions/0004-datenbank-postgres-supabase.md) — no
  local SQLite fallback, local dev needs a real reachable database)
- Setup:
  1. `npm install`
  2. `cp .env.example .env` and fill in `DATABASE_URL`/`DIRECT_URL` from
     your Supabase project's connection info, plus
     `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET`/`AI_GATEWAY_API_KEY`
  3. `npx prisma migrate dev`
  4. `npm run dev` — serves the app at `localhost:3000`
- Agent commands and quality gates: see [AGENTS.md](AGENTS.md)

## Use

The Next.js app scaffold, Prisma/Postgres wiring, and CI/deploy pipeline
(Epic A) are in place; the app itself (dashboard, chat, Strava sync) is
not yet built — see [docs/specs/](docs/specs/) for what's next.

- [CLAUDE.md](CLAUDE.md) — project context and product framing
- [docs/specs/](docs/specs/) — feature specs (EARS acceptance criteria),
  one subfolder per spec; implementation is tracked as
  [GitHub Issues](https://github.com/lorenzhelle/tempora-coach/issues),
  one milestone per spec

## Documentation

- Agent instructions: [AGENTS.md](AGENTS.md)
- Non-negotiable invariants: [docs/constitution.md](docs/constitution.md)
- Contribution workflow: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Operations: [docs/runbooks/runbook.md](docs/runbooks/runbook.md)
- Decision records: [docs/decisions/README.md](docs/decisions/README.md)
- Domain research (coaching logic): [docs/research/](docs/research/)

## Help and support

A personal project of a single operator/user — no public support channel.
Questions/bugs: directly in the repo as a
[GitHub issue](https://github.com/lorenzhelle/tempora-coach/issues).

## License or usage terms

`[NEEDS CONFIRMATION: no LICENSE file in the repo — private project,
license not yet decided]`
