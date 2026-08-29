# Tempora — Running Coach App — Project Context

> This document is Claude Code's directly loaded project context
> (product framing, domain background). For portable agent rules
> (exact commands, quality gates, conventions, boundaries),
> [AGENTS.md](AGENTS.md) is the canonical source; for architecture,
> [docs/architecture.md](docs/architecture.md); for repo-wide rules and
> conventions, [docs/rules.md](docs/rules.md). In case of
> conflict between this document and one of these sources, the more
> specialized file governs.

## What this is
A web app for a running training plan (current goal: 5 km under 20 minutes
in 12 months), synced with Strava (see ADR-0002), a dashboard with a weekly
plan/progress view, and a chat layer for adjusting the plan. Not a
chat-only interface — the dashboard is the primary view, chat is
supplementary (model: Runna, but much simpler). Tempora should be grounded in research and theory and easy to use for runners, focus on hobby and intermediate runners, not pros.


## Tech stack & architecture
Next.js (App Router, TypeScript) frontend + API routes, Postgres on
Supabase via Prisma (see ADR-0004), Claude via Vercel AI Gateway for the
chat layer, connected through the Vercel AI SDK (see ADR-0003, ADR-0006),
Strava sync via OAuth + webhooks. hosting on
Vercel Free Tier. Details, module map, and critical flows:
[docs/architecture.md](docs/architecture.md). Visual language:
[docs/design-system.md](docs/design-system.md).


## Domain background
The coaching logic (progression rates, pain traffic-light model, spike
rule, zone derivation, onboarding structure) is based on structured
research with primary sources (RCTs, cohort studies, meta-analyses). See
`docs/research/` — especially relevant for the system prompts in
[Spec 3](docs/specs/03-onboarding/spec.md) (onboarding) and
[Spec 5](docs/specs/05-chat-anpassung/spec.md) (chat-based adjustment).

## Decisions
Binding architecture/product decisions live as ADRs in
`docs/decisions/` (among them: app name, Strava as data source). In case of
conflict between this document and an ADR, the ADR governs.
