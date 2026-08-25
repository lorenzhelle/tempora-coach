# Specs

Jede Spec hat einen eigenen Unterordner mit `spec.md` (Ziel, Datenmodell,
Acceptance Criteria im EARS-Format) und `tickets.md` (Umsetzungsreihenfolge
für diese Spec). `00-fundament/` enthält Setup-Tickets, die keiner Spec
zugeordnet sind (kein `spec.md` dort).

- [00-fundament](00-fundament/tickets.md) — Projekt-Setup (kein Spec-Bezug)
- [01-strava-sync](01-strava-sync/spec.md) — Strava-Sync
- [02-plan-datenmodell](02-plan-datenmodell/spec.md) — Plan-Datenmodell
- [03-onboarding](03-onboarding/spec.md) — Onboarding — Plan-Erstellung im Chat
- [04-dashboard](04-dashboard/spec.md) — Dashboard
- [05-chat-anpassung](05-chat-anpassung/spec.md) — Chat-basierte Plan-Anpassung

Umsetzungsreihenfolge über alle Specs hinweg: 00 → 02 → 01 → 03 → 04 → 05
(entspricht der bisherigen Epic-Reihenfolge A → B → C → D → E aus der
früheren `TICKETS.md`, wobei Epic A auf 00-fundament und 02-plan-datenmodell
aufgeteilt ist).
