# Chat-Anpassungen — Tickets

Setzt auf [03-onboarding](../03-onboarding/tickets.md) auf. Siehe
[spec.md](spec.md) für Ziel und Acceptance Criteria.

### E1 — Plan-Kontext in Chat-Anfragen
- Bestehender Chat (aus C2) bekommt bei jeder Anfrage den aktuellen
  Plan-Stand + letzte N Aktivitäten als Tool-Ergebnisse mitgegeben
- **Akzeptanz:** Claude kann im Chat korrekt auf konkrete Wochen/Einheiten
  des bestehenden Plans referenzieren

### E2 — Gezielte Plan-Updates
- Tool für Claude, um einzelne Felder (z.B. eine `PlannedSession` verschieben,
  eine `TrainingWeek` anpassen) zu ändern, statt den ganzen Plan neu zu
  generieren (Spec 5, AC 1)
- **Akzeptanz:** Chat-Anfrage "verschieb den Sonntagslauf auf Montag" ändert
  nur das betroffene Feld, Rest des Plans bleibt unverändert

### E3 — Trainingsprinzipien-Check
- Vor Übernahme einer Änderung: Check gegen einfache Regeln (Spike-Regel:
  Einzellauf springt nicht stark über den längsten Lauf der letzten 30 Tage;
  siehe `docs/research/`), Warnung statt stiller Übernahme bei Verstoß
  (Spec 5, AC 4)
- **Akzeptanz:** Anfrage nach unrealistischer Sprungsteigerung löst einen
  Hinweis im Chat aus, bevor etwas geändert wird
