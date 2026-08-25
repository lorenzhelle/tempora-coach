# Onboarding — Tickets

Setzt auf [00-fundament](../00-fundament/tickets.md) und
[02-plan-datenmodell](../02-plan-datenmodell/tickets.md) auf. Siehe
[spec.md](spec.md) für Ziel und Acceptance Criteria.

### C1 — Chat-UI-Grundgerüst
- Einfache Chat-Komponente (Nachrichtenverlauf + Input), noch ohne
  Anthropic-Anbindung
- **Akzeptanz:** Nachrichten werden lokal im State gehalten und angezeigt

### C2 — Anthropic-Anbindung + Onboarding-Prompt
- API Route, die Claude mit System-Prompt (Coaching-Logik + Trainingsprinzipien)
  aufruft
- Tool-Definition für strukturierten Plan-Vorschlag (JSON gemäß Spec 2)
- **Akzeptanz:** Chat kann Zieldaten erfragen und einen Plan-Vorschlag als
  strukturierte Daten zurückgeben (Spec 3, AC 1+2)

### C3 — Plan-Bestätigung → DB
- Bei Bestätigung im Chat: Plan-Vorschlag wird in `Plan`/`Milestone`/
  `TrainingWeek`/`PlannedSession` persistiert
- **Akzeptanz:** Nach Bestätigung ist der Plan in der DB abfragbar (Spec 3,
  AC 3)
