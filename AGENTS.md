# AGENTS.md

## Scope

These instructions apply to the entire `tempora-coach` repository (product
name: Tempora). There are currently no nested `AGENTS.md` files.

## Read order

1. This `AGENTS.md` for executable working rules.
2. `docs/constitution.md` for non-negotiable invariants.
3. The document relevant to the task at hand: `docs/architecture.md`, the
   matching spec/tickets under `docs/specs/`, `docs/runbooks/runbook.md`,
   or `docs/decisions/README.md`.
4. `CLAUDE.md` for narrative project context (product framing, domain
   background) — supplements this document, does not replace it.

## Working directory and setup

- Repository root: `/` (the Next.js project is set up directly at the
  root, no `src/` directory)
- Prerequisites: Node.js 22 (see `.nvmrc`), npm
- Install/bootstrap: `npm install` (runs `prisma generate` via
  `postinstall`)
- Environment setup: copy `.env.example` to `.env` and fill in real
  values — `DATABASE_URL`/`DIRECT_URL` (Supabase Postgres, see
  [ADR-0004](docs/decisions/0004-datenbank-postgres-supabase.md)),
  `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET`, `ANTHROPIC_API_KEY` — details
  in `docs/constitution.md`. Supabase project creation is a human-only
  setup step (no dashboard access from a coding agent); local dev
  requires a real, reachable Supabase project — there is no offline
  SQLite fallback.

## Exact commands

Epic A (project setup, CI/deploy) is done; the Spec 2 data model is still
empty (see `docs/specs/02-plan-datenmodell/tickets.md`).

| Purpose | Command | Expected result |
| --- | --- | --- |
| Install | `npm install` | Installs deps, generates the Prisma client |
| Dev server | `npm run dev` | Next.js dev server starts on :3000 |
| Build | `npm run build` | Production build with no errors |
| Format | `npm run format` | Biome formats in place |
| Format check | `npm run format:check` | Biome reports formatting issues without writing |
| Lint | `npm run lint` | Biome check (lint + import organization) |
| Typecheck | `npm run typecheck` | `next typegen` then `tsc --noEmit` |
| E2E test | `npm run test:e2e` | Playwright (`e2e/`), auto-starts `npm run dev` against it — see "E2E testing" below |
| E2E test (UI mode) | `npm run test:e2e:ui` | Playwright's interactive test runner |
| Unit test | `[NEEDS CONFIRMATION: no unit test framework chosen — Vitest recommended, not yet wired up]` | — |
| DB migration | `npx prisma migrate dev --name <change>` | Applies against the Supabase Postgres `DIRECT_URL`; requires a real `.env` (see "Environment setup" above) |

## E2E testing

Playwright (`playwright.config.ts`, tests in `e2e/`), first test added:
`e2e/landing.spec.ts`. The config auto-starts `npm run dev` as the test
server (`webServer`) — no need to start it manually first. In this
sandbox, Chromium is pre-installed outside Playwright's own version-pinned
cache; the config points at it via `existsSync("/opt/pw-browsers/chromium")`
and falls back to Playwright's normal resolution everywhere else (CI runs
`npx playwright install --with-deps chromium` first, see
`.github/workflows/ci.yml`). **Never run `npx playwright install` in this
sandbox** — it will fail to match the pre-installed browser and isn't
needed.

## Quality gates

Before reporting a task done:

- `npm run format:check`
- `npm run lint`
- `npm run test:e2e` for any change touching a route/page
- `[NEEDS CONFIRMATION: unit tests for the changed scope — no framework chosen yet]`
- `npm run typecheck`
- `npm run build`
- `npx prisma migrate dev` runs cleanly, for any schema change
- Missing gates (because not yet set up) must be named explicitly in the
  completion report, not silently skipped

## Conventions

- Language/runtime: TypeScript (strict mode), Next.js 16 App Router, Node
  22 (see `.nvmrc`)
- Formatting/linting: Biome (`biome.json`) — combines both, no separate
  Prettier/ESLint config
- Naming: code/variable names in English (standard convention);
  comments/docs in English — the context layer was translated from
  German to English (2026-08-25), see `CLAUDE.md`
- Testing: `[NEEDS CONFIRMATION: when tests are mandatory and where they
  live — not yet decided]`
- Dependencies: `[NEEDS CONFIRMATION: approval/lockfile rules not yet
  defined]`
- Generated files: Prisma client output (`app/generated/prisma`,
  gitignored, regenerated via `postinstall`) and `.next/` are generated,
  don't edit by hand
- Database: Postgres on Supabase, no local SQLite (see
  [ADR-0004](docs/decisions/0004-datenbank-postgres-supabase.md)) —
  `DATABASE_URL` (pooled) for the app at runtime, `DIRECT_URL` (direct)
  for Prisma CLI/migrations

## Vendored agent skills

`.claude/skills/` holds official, vendor-published Claude Code skills for
this stack (Supabase, Vercel, Next.js), fetched from their upstream
GitHub repos via the `skills` CLI (`npx skills ...`) and committed —
`skills-lock.json` records each skill's source/version for
`npx skills update`. Installed: `supabase`,
`supabase-postgres-best-practices` (Supabase/Postgres work),
`vercel-react-best-practices` (React/Next.js performance), `next-dev-loop`,
`next-cache-components-adoption`, `next-partial-prefetching-adoption`
(Next.js). These are third-party content — review before trusting, they
run with full agent permissions. Deliberately **not** installed:
`deploy-to-vercel`, `vercel-cli-with-tokens` — both default to (or fall
back to) deploying via direct `vercel deploy` CLI invocation, which
conflicts with this project's deploy path below.

## Boundaries and approvals

- Deployment to Vercel always happens through the git-integration
  pipeline (ticket A3): push to `main` → production, PR → preview, gated
  by the CI checks in `.github/workflows/ci.yml`. Never invoke the Vercel
  CLI (`vercel deploy`, or a skill/script that wraps it) to deploy
  directly — that bypasses CI and produces an untracked deployment

- Never mutate plan data via business logic in the frontend — always
  through the API route (`docs/constitution.md` invariant DATA-001)
- Never regenerate the entire training plan on every chat message — only
  change the affected fields, targeted
- Never commit Strava access/refresh tokens or other secrets into the
  repo or logs (`docs/constitution.md` invariant SEC-001)
- Get human approval before: merging into the default branch, any schema
  migration that affects existing data, and any change to training
  principle rules (spike rule, pain-traffic-light thresholds)
- See `docs/constitution.md` for the full list of invariants

## Nested AGENTS.md precedence

- Root rules apply repository-wide.
- There are currently no nested `AGENTS.md` files.

## Task routing

| Task | Required document |
| --- | --- |
| Architecture change | `docs/architecture.md` + new ADR in `docs/decisions/` |
| Operations/deployment change | `docs/runbooks/runbook.md` |
| Product/scope question | `CLAUDE.md` ("What this is") + `docs/decisions/README.md` |
| New feature/spec | `docs/specs/<name>/spec.md` (EARS acceptance criteria) |
| UI/design question | `docs/design-system.md` (tokens, components) + the "Design" section of the relevant spec |
| Implementation order | `docs/specs/<name>/tickets.md`, overview in `docs/specs/README.md` |
| Contribution workflow | `docs/CONTRIBUTING.md` |
| Coaching/training logic | `docs/research/` |

## Completion report

Every completed task should include: files changed/created, verification
performed (which quality gates ran, which were missing and why), known
risks/open points, and follow-ups (e.g. a new ADR needed, spec/ticket
update needed).

## Maintenance

Update this document whenever build tooling, commands, test strategy,
quality gates, conventions, boundaries, or task routing change —
especially right after ticket A1/A2 from `docs/specs/` are done, once the
`[NEEDS CONFIRMATION]` placeholders can be replaced with real commands.
Target ceiling: 200 lines.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
