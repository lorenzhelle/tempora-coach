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
  root, see `docs/specs/00-fundament/tickets.md` ticket A1)
- Prerequisites: `[NEEDS CONFIRMATION: Node.js version — not yet decided,
  since Epic A1 "Project setup" hasn't been done yet]`
- Install/bootstrap: `[NEEDS CONFIRMATION: no package.json in the repo yet
  — will be added with Epic A1]`
- Environment setup: `.env` for secrets (Strava client ID/secret,
  Anthropic API key) — details in `docs/constitution.md`

## Exact commands

Status: The repo contains no code yet (no `package.json`, no CI config).
The commands below are the plan recorded in `CLAUDE.md`, but not yet
verified to run.

| Purpose | Command | Expected result |
| --- | --- | --- |
| Dev server | `npm run dev` | Next.js dev server starts (Epic A1) |
| Build | `npm run build` | Production build with no errors (Epic A1) |
| Format | `[NEEDS CONFIRMATION: no formatter configured]` | — |
| Lint | `[NEEDS CONFIRMATION: no linter configured]` | — |
| Typecheck | `[NEEDS CONFIRMATION: TypeScript strict mode is agreed on,
  but no `tsc` script exists yet]` | — |
| Focused test | `[NEEDS CONFIRMATION: no test framework chosen]` | — |
| Full test suite | `[NEEDS CONFIRMATION: no test framework chosen]` | — |
| DB migration | `[NEEDS CONFIRMATION: Prisma agreed on, schema/migration
  not set up yet — Epic A2]` | — |

**Once Epic A1/A2 are done, this table MUST be updated with the real
commands.**

## Quality gates

Before reporting a task done, once code exists:

- `[NEEDS CONFIRMATION: formatting/format-check command]`
- `[NEEDS CONFIRMATION: static analysis/lint command]`
- `[NEEDS CONFIRMATION: tests for the changed scope]`
- Build succeeds (`npm run build`), once Epic A1 is in place
- Prisma migration runs cleanly, once Epic A2 is in place
- Missing gates (because not yet set up) must be named explicitly in the
  completion report, not silently skipped

## Conventions

- Language/runtime: TypeScript (strict mode), Next.js App Router — exact
  versions `[NEEDS CONFIRMATION, to be set with Epic A1]`
- Formatting: `[NEEDS CONFIRMATION: no formatter/style guide chosen]`
- Naming: code/variable names in English (standard convention);
  comments/docs in German (personal project), see `CLAUDE.md`
- Testing: `[NEEDS CONFIRMATION: when tests are mandatory and where they
  live — not yet decided]`
- Dependencies: `[NEEDS CONFIRMATION: approval/lockfile rules not yet
  defined]`
- Generated files: Prisma client/migration output is generated, don't
  edit by hand (once Epic A2 is in place)

## Boundaries and approvals

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
