# Architecture

## Status

This document describes the **current** state, not an aspirational one.
As of now, no code exists in the repository — the architecture described
here is the **target architecture for the implementation**, bindingly
laid out in [CLAUDE.md](../CLAUDE.md), the specs under
[docs/specs/](specs/README.md), and the ADRs in
[docs/decisions/](decisions/README.md); it is not yet the verified
as-built state of a running system. This document MUST be updated once
[00-fundament](specs/00-fundament/tickets.md) is implemented, so it again
describes the real structure instead of the plan.

## System context

Tempora is a single-app web application (not a microservice fleet).
External dependencies:

- **Strava API** (OAuth + webhooks) as the sole data source for running
  activities — see [ADR-0002](decisions/0002-datenquelle-strava.md).
- **Anthropic API (Claude)** for the chat layer (onboarding dialog and
  plan adjustments), including tool use for structured plan updates —
  connected via the Vercel AI SDK, see
  [ADR-0003](decisions/0003-chat-layer-vercel-ai-sdk.md).
- **SQLite** as the only data store (no external DB server for v1).

## Module map (planned)

```
repository/
├── app/                    Next.js App Router — UI routes (dashboard, chat, onboarding)
├── app/api/                Next.js API routes — the only way to mutate plan data
│   ├── strava/oauth/       OAuth connect flow (Spec 1)
│   ├── strava/webhook/     Webhook endpoint for new activities (Spec 1)
│   └── chat/               Vercel AI SDK + Anthropic integration, tool definitions
│                           (Spec 3, Spec 5, ADR-0003)
├── prisma/                 Schema + migrations (Spec 2 data model)
└── lib/                    shared business logic (plan rules, training-principles check)
```

`[NEEDS CONFIRMATION: exact folder structure will only be verified with
Epic A1 and must then be updated here]`

## Data model

The plan data model (`Plan`, `Milestone`, `TrainingWeek`, `PlannedSession`,
`Activity`, `StravaConnection`) is fully specified in
[Spec 1](specs/01-strava-sync/spec.md) and
[Spec 2](specs/02-plan-datenmodell/spec.md) — not duplicated here, see
there.

## Critical flows

1. **Strava sync** (Spec 1): Strava webhook event → API route fetches the
   activity from the Strava API → deduplicates via `stravaActivityId` →
   stores it as an `Activity` → available to the dashboard and chat
   context.
2. **Onboarding** (Spec 3): Chat asks for the key inputs → Claude
   generates a structured plan proposal (JSON) → user confirms → the plan
   is persisted to `Plan`/`Milestone`/`TrainingWeek`/`PlannedSession`.
3. **Chat-based adjustment** (Spec 5): User request in chat → Claude gets
   the current plan state + recent activities as context → identifies the
   affected field → checks it against training principles (spike rule,
   see `docs/research/`) → changes it in a targeted way, warns on a
   violation instead of silently applying it.

## Cross-cutting concerns

- **Consistency:** Plan mutations run exclusively through API routes,
  never directly from frontend code (see `docs/constitution.md`
  DATA-001).
- **Security:** Strava tokens are kept encrypted/server-side, never in
  client code or logs (see `docs/constitution.md` SEC-001).
- **Resilience:** Strava sync via webhooks with a periodic fallback
  reconciliation (ticket B4), so lost webhook events don't lead to
  missing activities.
- **Deployment/CI:** Vercel git integration (push to `main` → production,
  PR → preview deployment) plus GitHub Actions CI (lint/typecheck/build
  before merge), see [ticket A3](specs/00-fundament/tickets.md).

## ADR index

Binding architecture decisions live as ADRs in
[docs/decisions/](decisions/README.md):

- [ADR-0001](decisions/0001-app-name-tempora.md) — App name: Tempora
- [ADR-0002](decisions/0002-datenquelle-strava.md) — Data source: Strava
  instead of a direct Garmin sync
- [ADR-0003](decisions/0003-chat-layer-vercel-ai-sdk.md) — Chat layer
  implementation: Vercel AI SDK

## Related documentation

- Agent instructions: [AGENTS.md](../AGENTS.md)
- Invariants: [docs/constitution.md](constitution.md)
- Operations: [docs/runbooks/runbook.md](runbooks/runbook.md)
- Feature specs: [docs/specs/](specs/README.md)
- Design system: [docs/design-system.md](design-system.md)

## Maintenance

Update once the tickets under `docs/specs/` are implemented and the real
structure diverges from the plan described here, and on every new
architecture ADR.
