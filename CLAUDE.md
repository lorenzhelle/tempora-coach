# Tempora — Running Coach App — Project Context

> This document is Claude Code's directly loaded project context
> (product framing, domain background). For portable agent rules
> (exact commands, quality gates, conventions, boundaries),
> [AGENTS.md](AGENTS.md) is the canonical source; for architecture,
> [docs/architecture.md](docs/architecture.md); for non-negotiable
> invariants, [docs/constitution.md](docs/constitution.md). In case of
> conflict between this document and one of these sources, the more
> specialized file governs.

## What this is
A web app for a running training plan (current goal: 5 km under 20 minutes
in 12 months), synced with Strava (see ADR-0002), a dashboard with a weekly
plan/progress view, and a chat layer for adjusting the plan. Not a
chat-only interface — the dashboard is the primary view, chat is
supplementary (model: Runna, but much simpler). v1 is deliberately scoped
to a single user (see "Out of scope" in
`docs/specs/00-fundament/tickets.md`), but the Strava OAuth architecture is
fundamentally multi-user-capable in case that's wanted later.

## Tech stack & architecture
Next.js (App Router, TypeScript) frontend + API routes, SQLite via Prisma,
Claude via Vercel AI Gateway for the chat layer, connected through the
Vercel AI SDK (see ADR-0003, ADR-0006),
Strava sync via OAuth + webhooks (no sidecar, see ADR-0002), hosting on
Vercel Free Tier. Details, module map, and critical flows:
[docs/architecture.md](docs/architecture.md). Visual language:
[docs/design-system.md](docs/design-system.md).

## Conventions, commands, anti-patterns
Canonical in [AGENTS.md](AGENTS.md) — also holds the current state of
`[NEEDS CONFIRMATION]` gaps (e.g. lint/test setup, which only comes into
being with Epic A1). Not duplicated here.

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
