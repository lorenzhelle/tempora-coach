# AGENTS.md

## Scope

These instructions apply to the entire `tempora-coach` repository (product
name: Tempora). There are currently no nested `AGENTS.md` files.

## Read order

1. This `AGENTS.md` for executable working rules.
2. `docs/rules.md` for repo-wide conventions.
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
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (Supabase Auth, see
  [ADR-0005](docs/decisions/0005-multi-user-supabase-auth.md)),
  `STRAVA_CLIENT_ID`/`STRAVA_CLIENT_SECRET`, `AI_GATEWAY_API_KEY` (Claude
  via Vercel AI Gateway, see
  [ADR-0006](docs/decisions/0006-vercel-ai-gateway.md); also covers
  onboarding voice-memo transcription, see
  [ADR-0007](docs/decisions/0007-vercel-ai-gateway-transcription.md) — not
  needed once deployed on Vercel itself, where OIDC is used automatically).
  Supabase project creation is a human-only
  setup step (no dashboard access from a coding agent); local dev
  requires a real, reachable Supabase project — there is no offline
  SQLite fallback. `proxy.ts` calls Supabase's Auth server on every
  request, so `npm run dev`/`npm run test:e2e` need real Supabase Auth
  values too, not just placeholders (`npm run build` doesn't — no page
  touches them at build time).

## Exact commands

Foundation setup (project setup, CI/deploy) is done; the Spec 2 data model
is still empty (see `docs/architecture.md` "Data model").

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
| Unit test | `npm run test:unit` | Vitest (`vitest.config.mts`), scoped to `packages/**/*.test.ts` — currently `packages/plan-engine` only (ADR-0009) |
| DB migration | `npx prisma migrate dev --name <change>` | Applies against the Supabase Postgres `DIRECT_URL`; requires a real `.env` (see "Environment setup" above) |

## E2E testing

Playwright (`playwright.config.ts`, tests in `e2e/`): `e2e/landing.spec.ts`,
`e2e/login.spec.ts`, `e2e/signup.spec.ts` — render-only checks (page loads,
expected heading/form visible, no console errors), no real signup/login
round trip yet (`[NEEDS CONFIRMATION]`: needs a seeded test account plus a
decision on Supabase's email-confirmation setting, both human/
dashboard-only — see [ADR-0005](docs/decisions/0005-multi-user-supabase-auth.md)).
The config auto-starts `npm run dev` as the test server (`webServer`) — no
need to start it manually first. Since `proxy.ts` calls Supabase's Auth
server on every request (ADR-0005), `npm run test:e2e` needs real
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` values
(from `.env.local` locally; from GitHub repo secrets in CI — a human-only
setup step, currently outstanding, that blocks the `e2e` CI job until
added). In this sandbox, Chromium is pre-installed outside Playwright's
own version-pinned cache; the config points at it via
`existsSync("/opt/pw-browsers/chromium")` and falls back to Playwright's
normal resolution everywhere else, i.e. real dev machines and CI (which
runs `npx playwright install --with-deps chromium` first, see
`.github/workflows/ci.yml`). **Never run `npx playwright install` in this
sandbox** — it will fail to match the pre-installed browser and isn't
needed (outside this sandbox, e.g. on a real dev machine, it's the normal
way to get Chromium installed).

## Quality gates

Before reporting a task done:

- `npm run format:check`
- `npm run lint`
- `npm run test:e2e` for any change touching a route/page
- `npm run test:unit` for any change touching `packages/plan-engine`
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

- Deployment to Vercel uses Vercel's own built-in staged-production-build
  workflow, no custom pipeline or tokens: push to `main` → Vercel's git
  integration auto-builds it (`vercel.json`'s `git.deploymentEnabled`
  only turns on git-triggered builds for `main`, PRs only run `ci`, no
  preview deployments). Production Branch stays `main`, but "Auto-assign
  Custom Production Domains" is turned off (Vercel → Project Settings →
  Environments → Production → Branch Tracking — see
  `docs/runbooks/runbook.md`), so that build lands **Staged**, not live.
  GitHub Actions runs `ci` then `e2e` on the same push purely as a
  visibility signal — neither gates or triggers anything on Vercel's
  side. Going live is always a manual, human action — "Promote to
  Production" in the Vercel dashboard (or `vercel promote` from the
  CLI). Never invoke the Vercel CLI/API to create or promote a
  deployment from a script/skill/agent — that's a human-only step

- Never mutate plan data via business logic in the frontend — always
  through the API route
- Never regenerate the entire training plan on every chat message — only
  change the affected fields, targeted
- Never commit Strava access/refresh tokens or other secrets into the
  repo or logs
- Get human approval before: merging into the default branch, any schema
  migration that affects existing data, and any change to training
  principle rules (spike rule, pain-traffic-light thresholds)
- See `docs/rules.md` for repo-wide conventions

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
| Implementation task tracking | GitHub Issues, one milestone per spec — see `docs/specs/README.md` and `docs/CONTRIBUTING.md` "Specs vs. issues vs. ADRs" |
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
