# Contributing

Tempora is currently a personal project of a single operator/user — not
an open project with external contributors. This workflow describes how
the operator themselves (or a coding agent working on their behalf)
works on the repository.

## Branching

- Feature/ticket branches off the default branch, named after the ticket/
  topic being worked on (e.g. `claude/laufcoach-strava-agent-70s1cq`).
- `[NEEDS CONFIRMATION: a binding branch-naming convention for future
  branches — so far only ad hoc]`

## Commits

- One commit per completed logical step, not per file.
- The commit message describes the "why," not just the "what" (see the
  commit history in `git log` as a model).

## Pull Requests

- `[NEEDS CONFIRMATION: no formal PR process established yet — so far
  direct commits on feature branches without third-party review, since
  it's a single-user project]`
- Once a PR is created: the description summarizes the change and its
  relation to the affected spec/tickets under `docs/specs/`.

## Review

- `[NEEDS CONFIRMATION: no second human reviewer available (single-user
  project) — review currently happens via the operator themselves or a
  coding agent per AGENTS.md]`

## Issues

- `[NEEDS CONFIRMATION: GitHub issues not yet enabled as a tracking
  mechanism — open tasks currently live in docs/specs/*/tickets.md]`
- New tasks not covered by any `docs/specs/*/tickets.md` should be added
  there as a new ticket in the matching spec folder (or in
  `docs/specs/00-fundament/tickets.md`, if there's no spec relation),
  instead of only being discussed in chat.

## Security reporting

- `[NEEDS CONFIRMATION: no public security-reporting channel — for a
  single-user project, contact the operator directly]`
- Rotate a discovered secret leak immediately (see `docs/constitution.md`
  SEC-001) (re-authorize the Strava app, regenerate the API key) before
  the commit is pushed/merged.

## Help

- Questions about project context: `CLAUDE.md`
- Questions about architecture: `docs/architecture.md`
- Questions about decisions: `docs/decisions/README.md`

## Related documentation

- Agent instructions and exact commands: [AGENTS.md](../AGENTS.md)
- Invariants and approval boundaries: [docs/constitution.md](constitution.md)

## Maintenance

Update whenever the branching, commit, PR, review, issue, or
security-reporting workflow changes — especially once a formal PR process
or additional contributors are added.
