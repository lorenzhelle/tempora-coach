# Constitution

Non-negotiable invariants for Tempora. These rules stand above `AGENTS.md`
conventions and may only be changed through a new, explicit decision (an
ADR in `docs/decisions/`) — never silently via a code change.

## Security

- **SEC-001** — Strava access/refresh tokens, the Anthropic API key, and
  all other secrets must never end up in the Git repository (code, config,
  logs, commit history). They live exclusively in `.env` (local) or in the
  hosting platform's secret mechanisms (Vercel environment variables).
- **SEC-002** — Strava access tokens expire after 6h. The refresh must
  happen automatically and proactively (before expiry), not reactively
  only once an API call fails (see `docs/specs/01-strava-sync/spec.md`
  Spec 1, AC 4).
- **SEC-003** — If a refresh token becomes invalid (the user revoked
  access in Strava), the connection MUST be marked as disconnected; the
  error must not block other syncs (see
  `docs/specs/01-strava-sync/spec.md` Spec 1, AC 5).

## Data integrity

- **DATA-001** — The training plan is a structured data model in the DB
  (`Plan`, `Milestone`, `TrainingWeek`, `PlannedSession`), not just text in
  the chat history. Mutations run exclusively through Next.js API routes —
  never directly from frontend code or unchecked from a chat response.
- **DATA-002** — Strava activities are deduplicated via
  `stravaActivityId`. A repeated sync run or a duplicate webhook event must
  never produce duplicate `Activity` entries (see
  `docs/specs/01-strava-sync/spec.md` Spec 1, AC 3).
- **DATA-003** — A chat-based adjustment changes only the affected fields
  of a plan, never regenerates the entire plan (see
  `docs/specs/05-chat-anpassung/spec.md` Spec 5, AC 1). This prevents
  already-confirmed parts of the plan from being overwritten unintentionally.

## Architecture boundaries

- **ARCH-001** — The data source for running activities is Strava (OAuth +
  webhooks), no more Garmin direct-sync sidecar (see
  [ADR-0002](decisions/0002-datenquelle-strava.md)). Changing the data
  source requires a new ADR that explicitly supersedes ADR-0002.
- **ARCH-002** — v1 stays deliberately limited to a single user (no auth
  system for multiple accounts). Expanding to multi-user is a separate,
  still-open decision (see "Out of scope" in
  `docs/specs/00-fundament/tickets.md`) and requires its own ADR before it
  is implemented.

## Training principles (domain safety rules)

- **SAFE-001** — A chat request that plans a single run that jumps sharply
  above the longest run of the last 30 days (RUNSAFE spike rule, see
  `docs/research/`) must not be silently applied. The system MUST flag it
  first, before applying the change (see
  `docs/specs/05-chat-anpassung/spec.md` Spec 5, AC 4).
- **SAFE-002** — Localized bone pain (shin/foot/hip) does not follow the
  normal pain-traffic-light logic (0–10 scale) — it is always a stop
  signal for impact loading, regardless of the numeric value (see
  `docs/research/progression-und-verletzungspraevention.md`).

## Human vs. agent approval gates

- Human approval required before: merging into the default branch, any
  destructive git operation (force-push, reset --hard), any schema
  migration affecting existing data, any change of data source or the
  multi-user decision (see ARCH-001/ARCH-002).
- A coding agent may, without asking first: implement code per the
  specs/tickets under `docs/specs/`, write/run tests, update documentation
  per this context layer.

## Governance metadata

- Owner: `[NEEDS CONFIRMATION: formal owner — currently the sole
  user/operator of the project]`
- Last reviewed: 2026-08-25
- Change process: An invariant is only changed through a new ADR, never
  through a silent code or doc change.

## Related documentation

- Agent instructions: [AGENTS.md](../AGENTS.md)
- Architecture: [docs/architecture.md](architecture.md)
- Decision history: [docs/decisions/README.md](decisions/README.md)

## Maintenance

Review whenever security, data-integrity, or architecture boundaries
change — every change goes through a new ADR, never a direct edit of
existing invariant IDs.
