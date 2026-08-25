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

- Required access: `[NEEDS CONFIRMATION: Vercel project access, Strava
  app dashboard access — not yet set up]`
- Required tools: `[NEEDS CONFIRMATION]`
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

`[NEEDS CONFIRMATION: deployment process not yet set up — planned: Vercel
git integration on the default branch + CI checks (lint/typecheck/build)
before every merge, see docs/specs/00-fundament/tickets.md ticket A3 and
docs/architecture.md]`

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
- Procedure: `[NEEDS CONFIRMATION: Vercel rollback mechanism not yet
  verified]`
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
