# Specs

Every spec has a `spec.md` (goal, data model, acceptance criteria in EARS
format) — the durable feature contract, kept in-repo. Implementation is
tracked as GitHub Issues, grouped under one milestone per spec (see
[docs/CONTRIBUTING.md](../CONTRIBUTING.md) "Specs vs. issues vs. ADRs" for
why the split works this way).

- Foundation (project setup, no spec relation) — done, see
  `docs/architecture.md` "Status"
- [01-strava-sync](01-strava-sync/spec.md) — Strava sync — [milestone](https://github.com/lorenzhelle/tempora-coach/milestone/1)
- [02-plan-datenmodell](02-plan-datenmodell/spec.md) — plan data model —
  models are added incrementally by the specs that consume them (see
  `docs/architecture.md` "Data model"), no separate milestone
- [03-onboarding](03-onboarding/spec.md) — onboarding — plan creation in chat — [milestone](https://github.com/lorenzhelle/tempora-coach/milestone/2)
- [04-dashboard](04-dashboard/spec.md) — dashboard — [milestone](https://github.com/lorenzhelle/tempora-coach/milestone/3)
- [05-chat-anpassung](05-chat-anpassung/spec.md) — chat-based plan adjustment — [milestone](https://github.com/lorenzhelle/tempora-coach/milestone/4)

Implementation order across all specs: Foundation → 02 → 01 → 03 → 04 → 05.
