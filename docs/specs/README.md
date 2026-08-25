# Specs

Every spec has its own subfolder with `spec.md` (goal, data model,
acceptance criteria in EARS format) and `tickets.md` (the implementation
order for that spec). `00-fundament/` contains setup tickets not tied to
any spec (no `spec.md` there).

- [00-fundament](00-fundament/tickets.md) — project setup (no spec relation)
- [01-strava-sync](01-strava-sync/spec.md) — Strava sync
- [02-plan-datenmodell](02-plan-datenmodell/spec.md) — plan data model
- [03-onboarding](03-onboarding/spec.md) — onboarding — plan creation in chat
- [04-dashboard](04-dashboard/spec.md) — dashboard
- [05-chat-anpassung](05-chat-anpassung/spec.md) — chat-based plan adjustment

Implementation order across all specs: 00 → 02 → 01 → 03 → 04 → 05
(matches the earlier epic order A → B → C → D → E from the former
`TICKETS.md`, with epic A split across 00-fundament and
02-plan-datenmodell).
