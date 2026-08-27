# Runbook: Tempora

## Ownership and metadata

- Scope: the entire Tempora web app (Next.js app + Strava sync), once
  deployed
- Owner: `[NEEDS CONFIRMATION: formal owner — currently the sole
  operator/user of the project]`
- Escalation owner: `[NEEDS CONFIRMATION: no second team member, since
  it's a single-user project]`
- Criticality: `[NEEDS CONFIRMATION: not yet classified — no production
  operation exists]`
- Last verified: 2026-08-25 — **Status: no deployment exists yet.** These
  procedures haven't been tested yet.
- Review cadence: `[NEEDS CONFIRMATION]`

## Purpose and limits

This runbook is meant to cover operating the Tempora app once it's
deployed (Vercel Free Tier, see `docs/architecture.md`). **Current state:**
the repository contains no code yet
(`docs/specs/00-fundament/tickets.md` hasn't been implemented) — there's
no running instance, no dashboards, no alerts. This section and the ones
below MUST be filled in with real, verified values once a first
deployment exists, instead of publishing plausible but unverified
procedures.

## Access and safety prerequisites

- Required access: Vercel project access (dashboard), GitHub repo admin
  access (branch protection), Strava app dashboard access — Vercel
  project creation/connection and branch protection are human-only setup
  steps, no dashboard access from a coding agent (see `AGENTS.md`
  "Boundaries and approvals")
- Required tools: Vercel dashboard, GitHub repo Settings, browser
- Approval gates: see `docs/constitution.md` ("Human vs. agent approval
  gates") — destructive operations (DB reset, force-push) require human
  approval
- Secret handling: secrets live in Vercel environment variables or a
  local `.env` (never in the git repo, see `docs/constitution.md`
  SEC-001) — NEVER put concrete values into this document
- Stop conditions: `[NEEDS CONFIRMATION]`

## Signals and healthy state

| Signal | Location | Healthy state | Owner |
| --- | --- | --- | --- |
| `[NEEDS CONFIRMATION: no deployment yet, no monitoring signals yet]` | — | — | — |

Once deployed: add at least Vercel deployment status, the Strava webhook
delivery rate (failed events), and the API routes' error rate as minimal
signals.

## Routine operations

### Deployment

Steady state (once the one-time setup below is done): a PR runs only the
`ci` job (lint/typecheck/build) — no preview deployment. A push to `main`
auto-builds as a Vercel **Preview** deployment (ordinary git integration,
just scoped to `main` only — see `vercel.json`), while GitHub Actions
runs `ci` then `e2e` against that same commit; only once both pass does
the `promote-production` job call the Vercel API to promote that exact
Preview build to Production. e2e is a pre-production gate, not a per-PR
check — it needs a real, reachable Supabase project (see below), which is
only worth paying the run time for once, right before a promotion, not
on every PR push.

Never invoke `vercel deploy` or the Vercel promote API directly outside
this pipeline (see `AGENTS.md` "Boundaries and approvals") — production
only ever gets a new deployment once `ci`/`e2e` have both passed on the
same commit.

**One-time setup (human/dashboard-only — a coding agent has no Vercel or
GitHub-admin dashboard access):**

1. **Connect the project**: Vercel → Add New Project → import
   `lorenzhelle/tempora-coach`. Next.js is auto-detected, no build
   command override needed.
2. **Point Production Branch away from `main`**: Vercel → Project
   Settings → Git → Production Branch → change it to any other value
   (e.g. `vercel-production` — it doesn't need to exist as a real
   branch). Without this, Vercel treats every deploy of `main` as a
   Production deployment automatically, which defeats the point of
   promoting only after `ci`/`e2e` pass. With it changed, `main` builds
   land as ordinary Preview deployments, exactly like any other branch.
3. **Environment variables** (Vercel → Project Settings → Environment
   Variables): add every var from `.env.example`
   (`DATABASE_URL`/`DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`/
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `STRAVA_CLIENT_ID`/
   `STRAVA_CLIENT_SECRET`, `ANTHROPIC_API_KEY`) with the real values, for
   both the Production and Preview environments (the `main` branch build
   that later gets promoted is technically a Preview deployment while it
   waits on `ci`/`e2e`, so it needs working env vars too). Never put
   concrete secret values in this repo or in this document (SEC-001).
4. **Collect the four `VERCEL_*` GitHub secrets** (Settings → Secrets and
   variables → Actions on the GitHub repo):
   - `VERCEL_TOKEN` — a Vercel Account/Team API token (Vercel → Account
     Settings → Tokens), scoped no wider than necessary.
   - `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` — from Vercel → Project
     Settings → General ("Project ID", "Team ID" — leave `VERCEL_ORG_ID`
     unset if the project is under a personal account, not a team).
   - `VERCEL_MAIN_BRANCH_URL` — the stable alias Vercel assigns to the
     latest deployment of `main` (visible on the project's Deployments
     tab after the first push to `main`, or predictable as
     `<project>-git-main-<team-or-username>.vercel.app`).
   Treat all four like credentials — never in the repo, only as GitHub
   Actions secrets.
5. **`e2e` CI job secrets**: `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as GitHub Actions repo secrets
   — outstanding since ticket A4, blocks the `e2e` job (and therefore the
   promotion) from ever succeeding until added.
6. **Require `ci` before merge**: GitHub → repo Settings → Branches → add
   a protection rule on `main` → "Require status checks to pass before
   merging" → select `ci` (the only job that runs on every PR; `e2e` and
   `promote-production` only run post-merge on push to `main`, so don't
   list them as required PR checks).

**Unverified**: this exact promotion mechanism (`.github/workflows/ci.yml`
job `promote-production`, polling `GET /v13/deployments/{url}` then
`POST /v10/projects/{id}/promote/{deploymentId}`) has not been run
against a real Vercel project yet — none exists. If it doesn't work as
written once one does, the fallback is Vercel's own "Promote to
Production" button in the deployment's dashboard view (manual, one click,
no code involved) — use that rather than debugging the automation under
time pressure, then fix the workflow afterward.

### Strava sync mechanism

Already decided, not a deployment choice: Strava sync runs on real
webhooks (one app-wide subscription), not polling — see
[ADR-0002](../decisions/0002-datenquelle-strava.md). Ticket B4's
"periodic fallback reconciliation" is a safety net for missed webhook
events, not a replacement primary mechanism. Nothing to configure on
Vercel for this beyond the webhook route existing (Spec 1, not yet
implemented) and its endpoint URL being registered with Strava's API
once deployed.

### Renew/check the Strava webhook subscription

`[NEEDS CONFIRMATION: procedure follows with ticket B2 from
docs/specs/01-strava-sync/tickets.md, once the webhook endpoint exists]`

## Diagnostics

### Strava sync isn't delivering new activities

1. Check whether the Strava webhook subscription is active —
   `[NEEDS CONFIRMATION: exact check command/endpoint follows with
   ticket B2]`
2. Check whether `StravaConnection.expiresAt` is in the past (an expired
   token that wasn't refreshed automatically — a violation of
   `docs/constitution.md` SEC-002)
3. Manually trigger the fallback reconciliation (ticket B4) to check
   whether it's a lost webhook event

### Chat isn't generating a plan proposal, or generates a broken one

1. Check whether the Anthropic API key is valid
2. Check whether the tool definition (Spec 3) matches the current Prisma
   schema (Spec 2)

## Mitigation

`[NEEDS CONFIRMATION: concrete mitigation procedures follow once a first
deployment exists and real failure modes are known]`

## Validation

After every operation/mitigation:

1. `[NEEDS CONFIRMATION: primary health signal]`
2. Confirm that no duplicate `Activity` entries were created (see
   `docs/constitution.md` DATA-002)
3. Confirm that the training plan is consistent in the DB (no orphaned
   `PlannedSession` entries without a `TrainingWeek`)

## Rollback and recovery

- Trigger: `[NEEDS CONFIRMATION]`
- Known-good reference: last successful Vercel deployment (git commit)
- Procedure: Vercel → Project → Deployments → find the last known-good
  production deployment → "..." menu → "Instant Rollback". This
  repoints production traffic without a new build/deploy. `[NEEDS
  CONFIRMATION: not yet verified against a real deployment]`
- Data protection measures: SQLite backup before every schema migration
  `[NEEDS CONFIRMATION: concrete backup mechanism not yet set up]`

## Escalation

| Trigger | Route | Information |
| --- | --- | --- |
| `[NEEDS CONFIRMATION: no escalation process defined — single-user project]` | — | — |

## Communication

`[NEEDS CONFIRMATION: no stakeholder group besides the operator
themselves]`

## Post-incident follow-up

- Record the timeline and root cause once a first incident occurs
- For a recurring root cause: consider a new ADR or constitution
  invariant (see `docs/decisions/README.md`)

## Related documentation

- Agent instructions and development gates: [AGENTS.md](../../AGENTS.md)
- Non-negotiable invariants: [docs/constitution.md](../constitution.md)
- Architecture and dependencies: [docs/architecture.md](../architecture.md)
- Decision history: [docs/decisions/README.md](../decisions/README.md)

## Maintenance

This runbook MUST be revised once the first deployment exists — the
`[NEEDS CONFIRMATION]` placeholders are then to be replaced with verified
values, not plausible assumptions. After that: update after every
incident, every access/signal change, and every deployment or dependency
change.
