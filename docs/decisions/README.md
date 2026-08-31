# Decision Records

Short ADRs (Architecture Decision Records) for decisions that bindingly
settle the context layer (`CLAUDE.md`, `docs/specs/`). Every decision here
is binding for the current state — a conflict between the context files
and an ADR is a bug in the context layer and should be fixed as soon as
it's noticed.

Format: Status, Context, Decision, Consequences. A new decision that
revises an old one gets a new number and marks the old one as "Superseded
by ADR-XXXX" instead of deleting it. Once decided, an ADR's body is not
rewritten even when a later change makes a detail in it stale (e.g. a
link to a since-renamed/removed file) — it's a historical record, not a
living doc; a later ADR amends/supersedes it explicitly instead.

**Exception:** an ADR that turns out to be a content decision (training
methodology, product copy, which questions to ask) rather than an
architecture one gets deleted outright instead of superseded, and its
still-binding content moves into the spec it actually belongs in — see
[ADR-0009](0009-plan-engine-package.md)'s "Related documentation" for a
worked example (former ADR-0008). The no-delete rule above is about
architecture history staying legible; it was never meant to pin a content
decision to the ADR log just because it once lived there by accident.

**When a decision needs an ADR:** it's hard or expensive to reverse, or a
future agent could plausibly re-derive it differently without this
record (choice of a vendor/provider, data source, or storage engine;
anything that changes what's committed to the repo vs. held as a secret;
anything that revises an existing decision recorded here). An
implementation choice made *within* an already-decided architecture
(e.g. which component holds a piece of state) doesn't need one — that
level of detail belongs in code comments, the relevant spec, or a PR
description instead.

- [ADR-0001](0001-app-name-tempora.md) — App name: Tempora
- [ADR-0002](0002-datenquelle-strava.md) — Data source: Strava instead of
  a direct Garmin sync
- [ADR-0003](0003-chat-layer-vercel-ai-sdk.md) — Chat layer implementation:
  Vercel AI SDK
- [ADR-0004](0004-datenbank-postgres-supabase.md) — Database: Postgres on
  Supabase instead of local SQLite
- [ADR-0005](0005-multi-user-supabase-auth.md) — Multi-user support via
  Supabase Auth
- [ADR-0006](0006-vercel-ai-gateway.md) — Model provider connection:
  Vercel AI Gateway instead of a direct Anthropic provider
- [ADR-0007](0007-vercel-ai-gateway-transcription.md) — Voice-memo
  transcription: Vercel AI Gateway instead of a direct Deepgram provider
- ~~ADR-0008~~ — was "Full-horizon plan generation via a deterministic
  progression algorithm"; deleted (see the format-exception note above).
  Its architecture decision is now [ADR-0009](0009-plan-engine-package.md);
  its content decisions live in
  [Spec 2](../specs/02-plan-datenmodell/spec.md) and
  [Spec 3](../specs/03-onboarding/spec.md).
- [ADR-0009](0009-plan-engine-package.md) — Deterministic plan generation
  lives in a workspace package, `packages/plan-engine`
