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
no Vercel project exists yet — there's no running instance, no
dashboards, no alerts. This section and the ones
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
- Approval gates: see `AGENTS.md` ("Boundaries and approvals") —
  destructive operations (DB reset, force-push) require human approval
- Secret handling: secrets live in Vercel environment variables or a
  local `.env` (never in the git repo) — NEVER put concrete values into
  this document
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
auto-builds via Vercel's ordinary git integration (scoped to `main`
only — see `vercel.json`), while GitHub Actions runs `ci` then `e2e`
against that same commit purely for visibility — neither job gates or
triggers anything on Vercel's side. The build itself lands as a
**Staged** production deployment: built and ready, but not yet serving
traffic, because Production Branch stays `main` while Vercel's
"Auto-assign Custom Production Domains" is turned off (see setup step 3
below).

Going live is a manual, one-click action, no rebuild: Vercel dashboard →
Deployments → find the staged build for that commit → "…" → **Promote
to Production**. This is Vercel's own built-in staged-production-build
workflow — see ["Staging and promoting a production
deployment"](https://vercel.com/docs/deployments/promoting-a-deployment#staging-and-promoting-a-production-deployment).
`vercel promote` from the CLI does the same thing.

Never invoke `vercel deploy`/`vercel promote` or the Vercel API to
create or promote a deployment from a script/skill/agent (see
`AGENTS.md` "Boundaries and approvals") — going to production is always
a manual dashboard click by a human.

**One-time setup (human/dashboard-only — a coding agent has no Vercel or
GitHub-admin dashboard access):**

1. **Connect the project**: Vercel → Add New Project → import
   `lorenzhelle/tempora-coach`. Next.js is auto-detected, no build
   command override needed.
2. **Production Branch stays `main`** (Vercel's default) — Project
   Settings → Git → Production Branch. Nothing to change here.
3. **Turn off auto-assignment of the production domain**: Project
   Settings → Environments → **Production** → **Branch Tracking** →
   disable **Auto-assign Custom Production Domains**. Without this,
   every push to `main` goes live immediately; with it off, a push just
   builds and waits for a manual Promote.
4. **Environment variables** (Vercel → Project Settings → Environment
   Variables): add every var from `.env.example`
   (`DATABASE_URL`/`DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`/
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `STRAVA_CLIENT_ID`/
   `STRAVA_CLIENT_SECRET`, `AI_GATEWAY_API_KEY`) with the real values, for
   the Production environment. Never put concrete secret values in this
   repo or in this document (SEC-001).
5. **`e2e` CI job secrets**: `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as GitHub Actions repo secrets
   — currently missing, which is why `e2e` shows red on every push to
   `main`. Harmless (it's informational only, nothing depends on it
   passing), but worth fixing so the signal is meaningful again.
6. **Require `ci` before merge**: GitHub → repo Settings → Branches → add
   a protection rule on `main` → "Require status checks to pass before
   merging" → select `ci` (the only job that runs on every PR; `e2e`
   only runs post-merge on push to `main`, so don't list it as a
   required PR check).

No `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`/
`VERCEL_MAIN_BRANCH_URL` GitHub Actions secrets are needed for this flow
— it's all built into Vercel's dashboard/CLI. If any of those four exist
from an earlier setup attempt, they can be deleted (Settings → Secrets
and variables → Actions).

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

`[NEEDS CONFIRMATION: procedure follows once the webhook endpoint exists
— see issue B2, milestone 01-strava-sync]`

## Diagnostics

### Strava sync isn't delivering new activities

1. Check whether the Strava webhook subscription is active —
   `[NEEDS CONFIRMATION: exact check command/endpoint follows with
   ticket B2]`
2. Check whether `StravaConnection.expiresAt` is in the past (an expired
   token that wasn't refreshed automatically)
3. Manually trigger the fallback reconciliation (ticket B4) to check
   whether it's a lost webhook event

### Chat isn't generating a plan proposal, or generates a broken one

1. Check whether the AI Gateway API key (`AI_GATEWAY_API_KEY`) is valid —
   or, for a deployment on Vercel itself, whether the automatic OIDC
   token is being picked up (see
   [ADR-0006](../decisions/0006-vercel-ai-gateway.md))
2. Check whether the tool definition (Spec 3) matches the current Prisma
   schema (Spec 2)

## Mitigation

`[NEEDS CONFIRMATION: concrete mitigation procedures follow once a first
deployment exists and real failure modes are known]`

## Validation

After every operation/mitigation:

1. `[NEEDS CONFIRMATION: primary health signal]`
2. Confirm that no duplicate `Activity` entries were created
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
- For a recurring root cause: consider a new ADR (see
  `docs/decisions/README.md`)

## Related documentation

- Agent instructions and development gates: [AGENTS.md](../../AGENTS.md)
- Rules and conventions: [docs/rules.md](../rules.md)
- Architecture and dependencies: [docs/architecture.md](../architecture.md)
- Decision history: [docs/decisions/README.md](../decisions/README.md)

## Maintenance

This runbook MUST be revised once the first deployment exists — the
`[NEEDS CONFIRMATION]` placeholders are then to be replaced with verified
values, not plausible assumptions. After that: update after every
incident, every access/signal change, and every deployment or dependency
change.
