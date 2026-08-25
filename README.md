# Tempora

Tempora is a web app for a structured running training plan (current
goal: 5 km under 20 minutes). It syncs running activities via Strava (see
[ADR-0002](docs/decisions/0002-datenquelle-strava.md)), keeps the training
plan as a structured data model instead of just text, shows it in a
dashboard, and allows adjustments through a chat layer.

## Who this is for

v1 is deliberately scoped to a single user (see "Out of scope" in
[docs/specs/00-fundament/tickets.md](docs/specs/00-fundament/tickets.md)).
The Strava OAuth architecture is fundamentally multi-user-capable in case
that's wanted later.

## Prerequisites and setup

- Prerequisites: `[NEEDS CONFIRMATION: Node.js version — not yet decided]`
- Setup: There's no runnable code yet — the project setup is
  [docs/specs/00-fundament/tickets.md](docs/specs/00-fundament/tickets.md)
  ticket A1 ("Project setup"). Update this section once that's done.
- Agent commands and quality gates: see [AGENTS.md](AGENTS.md)

## Use

There's currently no runnable app — the repository is in the
planning/context phase. Current state:

- [CLAUDE.md](CLAUDE.md) — project context and product framing
- [docs/specs/](docs/specs/) — feature specs (EARS acceptance criteria)
  and their tickets, one subfolder per spec

## Documentation

- Agent instructions: [AGENTS.md](AGENTS.md)
- Non-negotiable invariants: [docs/constitution.md](docs/constitution.md)
- Contribution workflow: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Operations: [docs/runbooks/runbook.md](docs/runbooks/runbook.md)
- Decision records: [docs/decisions/README.md](docs/decisions/README.md)
- Domain research (coaching logic): [docs/research/](docs/research/)

## Help and support

A personal project of a single operator/user — no public support channel.
Questions/bugs: directly in the repo as an issue, once GitHub issues are
enabled (`[NEEDS CONFIRMATION]`).

## License or usage terms

`[NEEDS CONFIRMATION: no LICENSE file in the repo — private project,
license not yet decided]`
