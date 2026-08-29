# ADR-0009: Deterministic plan generation lives in a workspace package, `packages/plan-engine`

## Status
Decided — 2026-08-29

## Context
[ADR-0008](0008-full-horizon-deterministic-plan-generation.md) decided that
plan generation moves off a single LLM tool call onto a deterministic
algorithm, but left its location and API as "an implementation ticket, not
settled here." That module now exists — `packages/plan-engine`
(`@tempora/plan-engine`) — and needs an ADR of its own, since introducing a
second package into what has been a flat, single-`package.json` Next.js repo
is exactly the kind of hard-to-reverse structural choice `docs/decisions/README.md`
says warrants one; the training-methodology content ADR-0008 also carried
(intake fields, day-of-week assignment, replan semantics) is not part of
this decision — it belongs in `docs/specs/02-plan-datenmodell/spec.md` and
`docs/specs/03-onboarding/spec.md` instead, and ADR-0008 itself is being
removed rather than superseded, since it was a content decision wearing
architecture-ADR clothing (see "Related documentation" and "Consequences" —
that removal, and the specs update it requires, land in a follow-up PR to
stay within `docs/rules.md`'s per-PR file-count limit).

The repo has no monorepo tooling today: no `pnpm-workspace.yaml`, no
`turbo.json`, a single root `tsconfig.json`, `next.config.ts` with no
`transpilePackages`. Two options were considered for where the engine's code
should live:

1. **A `lib/plan-engine/` directory**, following the existing `lib/coaching/`
   precedent — zero build/CI/Vercel wiring, but importable from anywhere in
   the app by convention only; nothing stops `app/api/chat/route.ts` from
   reaching into its internals.
2. **An npm workspace package**, `packages/plan-engine`, with its own
   `package.json`. Costs real wiring (root `workspaces` field,
   `transpilePackages`, an extra `tsconfig.json`), but its public surface is
   whatever `src/index.ts` exports — nothing else is importable from outside
   the package, npm enforces it structurally, and the package is genuinely
   extractable later (a real goal here: the engine is meant to be liftable
   into a standalone library, per the project's own framing of it as
   something to "later easily pull out, potentially as its own npm
   package").

## Decision
Deterministic plan generation lives at **`packages/plan-engine`**, an npm
workspace package (`@tempora/plan-engine`), not a `lib/` directory.

- Root `package.json` gains `"workspaces": ["packages/*"]`.
- `next.config.ts` gains `transpilePackages: ["@tempora/plan-engine"]` — the
  package ships raw TypeScript (`"main": "src/index.ts"`), no build step, so
  Next.js must transpile it itself rather than consuming compiled output.
- The package's only dependency is `zod`; it imports nothing from the app
  (`@/lib/*`, Prisma, `ai`) and nothing app-side imports its internals —
  only `packages/plan-engine/src/index.ts`, its public surface. This is
  enforced by a grep-based test (`src/__tests__/boundary.test.ts`) rather
  than `eslint-plugin-boundaries` or a dependency-cruiser config, since the
  repo has no module-boundary tooling yet (`docs/architecture.md`'s module
  map is documented prose, not mechanically enforced) — a grep test is the
  cheapest enforcement that still fails CI on a violation.
- The package is also **pure and deterministic**: no `Date.now()`/`new Date()`
  with no argument, no `Math.random()`, no `process.env` — `today` and
  `startDate` are explicit function inputs. Same input always produces the
  same output, which is what makes the plan-generation pipeline unit- and
  regression-testable independent of the running app.
- Root `tsconfig.json`'s `include` picks up `packages/**/*.ts` automatically
  (no `rootDir` restriction existed to exclude it), so `npm run typecheck`
  already covers the package with no separate command.
- **Unit tests are Vitest**, run via a new `npm run test:unit` script and a
  root `vitest.config.mts` scoped to `packages/**/*.test.ts`. AGENTS.md
  already flagged Vitest as "recommended, not yet wired up" — this settles
  it, for the plan engine specifically; nothing here requires Vitest be used
  for future app-level unit tests, though it's the natural default now that
  the tooling exists.
- The package has no build/publish step — `"main": "src/index.ts"` relies on
  `transpilePackages` inside this repo. If it's ever actually extracted to a
  standalone library (the stated long-term goal), it gains a real build at
  that point; nothing here blocks that.

## Consequences
- `package.json`, `package-lock.json`: `workspaces` field added; `vitest`
  added as a root devDependency.
- `next.config.ts`: `transpilePackages: ["@tempora/plan-engine"]`.
- `tsconfig.json`: `exclude` gains `packages/*/node_modules` (each workspace
  package gets its own `node_modules` via npm's workspace hoisting/linking).
- New: `packages/plan-engine/{package.json,tsconfig.json,src/**}`,
  `vitest.config.mts`.
- `AGENTS.md`: the unit-test `[NEEDS CONFIRMATION]` row becomes
  `npm run test:unit`; the quality-gates list gains it.
- `docs/architecture.md`: module map gains `packages/plan-engine/`.
- Any future second workspace package reuses this wiring directly — the
  `workspaces` field and `transpilePackages` array both already support more
  than one entry.
- **Not shipped with this ADR** (follow-up PR, kept separate to stay under
  `docs/rules.md`'s per-PR file-count limit): deleting
  `docs/decisions/0008-full-horizon-deterministic-plan-generation.md` and its
  `docs/decisions/README.md` entry, and folding its still-binding content
  (the onboarding-intake fields, the 12-month horizon cap, day-of-week
  assignment, replan semantics) into `docs/specs/02-plan-datenmodell/spec.md`
  and `docs/specs/03-onboarding/spec.md`.

## Related documentation
- Historical predecessor, being removed rather than superseded (see Context
  and the "Not shipped with this ADR" note above — its still-binding content
  is moving into specs, not into this ADR):
  [former ADR-0008](https://github.com/lorenzhelle/tempora-coach/blob/ab4d181/docs/decisions/0008-full-horizon-deterministic-plan-generation.md),
  moving to [Spec 2](../specs/02-plan-datenmodell/spec.md) and
  [Spec 3](../specs/03-onboarding/spec.md).
- Research this package implements:
  `docs/research/designing-a-plan-generator.md`,
  `docs/research/progression-und-verletzungspraevention.md`.
- Rules and conventions: [docs/rules.md](../rules.md)
- Package boundary test: `packages/plan-engine/src/__tests__/boundary.test.ts`
