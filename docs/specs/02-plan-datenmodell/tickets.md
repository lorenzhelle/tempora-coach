# Plan-Datenmodell — Tickets

Setzt auf [00-fundament](../00-fundament/tickets.md) auf. Siehe
[spec.md](spec.md) für Ziel und Acceptance Criteria.

### A2 — Datenmodell anlegen (Spec 2)
- Prisma-Schema für `Plan`, `Milestone`, `TrainingWeek`, `PlannedSession`,
  `Activity` gemäß Spec 2
- Migration erzeugen und lokal testen
- **Akzeptanz:** Alle Modelle aus Spec 2 existieren als Tabellen, Relationen
  funktionieren (z.B. `PlannedSession.linkedActivityId` → `Activity`)
