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

Steady state (once the one-time setup below is done): push to `main` →
Vercel production deployment; every PR → its own Vercel preview
deployment. Never invoke `vercel deploy` directly (see `AGENTS.md`
"Boundaries and approvals") — the git-integration path is the only
sanctioned way to deploy, and it's what keeps a deploy tied to a commit
that actually passed CI.

**One-time setup (human/dashboard-only — a coding agent has no Vercel or
GitHub-admin dashboard access):**

1. **Connect the project**: Vercel → Add New Project → import
   `lorenzhelle/tempora-coach`. Next.js is auto-detected, no build
   command override needed.
2. **Environment variables** (Vercel → Project Settings → Environment
   Variables): add every var from `.env.example`
   (`DATABASE_URL`/`DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`/
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `STRAVA_CLIENT_ID`/
   `STRAVA_CLIENT_SECRET`, `ANTHROPIC_API_KEY`), scoped per environment:
   - **Production**: the real Supabase/Strava/Anthropic values.
   - **Preview**: point at a *separate* Supabase project, not
     production — same var names, different project's URL/keys — so
     that PR preview deployments never read or write production data.
     Strava/Anthropic credentials can stay shared with Production (no
     per-PR Strava app) unless a later ticket says otherwise.
   - Never put concrete secret values in this repo or in this document
     (SEC-001).
3. **Gate production deploys on CI**: Vercel deploys whatever lands on
   `main`, so the actual gate is GitHub branch protection, not the
   Vercel build. GitHub → repo Settings → Branches → add a protection
   rule on `main` → "Require status checks to pass before merging" →
   select both jobs from `.github/workflows/ci.yml` (`ci`, `e2e`). This
   also blocks a preview deployment's underlying PR from being merged
   while checks are red — previews themselves still build on every push
   (that's expected; you want to see a preview before checks finish).
4. **`e2e` CI job secrets**: `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as GitHub Actions repo secrets
   (Settings → Secrets and variables → Actions) — outstanding since
   ticket A4, blocks the `e2e` job from passing (and therefore blocks
   merges once step 3 is enabled) until added.

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
