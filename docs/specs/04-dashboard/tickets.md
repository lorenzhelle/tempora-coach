# Dashboard — Tickets

Setzt auf [00-fundament](../00-fundament/tickets.md) und
[02-plan-datenmodell](../02-plan-datenmodell/tickets.md) auf. Siehe
[spec.md](spec.md) für Ziel und Acceptance Criteria.

### D1 — Wochenübersicht
- View, die die aktuelle `TrainingWeek` (basierend auf heutigem Datum) lädt
  und alle `PlannedSession` anzeigt
- **Akzeptanz:** Richtige Woche wird anhand des Datums bestimmt (Spec 4, AC 1)

### D2 — Nächste Einheit + Status
- Hervorhebung der nächsten offenen Einheit
- Automatische "verpasst"-Markierung für vergangene Einheiten ohne verknüpfte
  Aktivität (Spec 4, AC 2)
- **Akzeptanz:** Manuell in der DB eine vergangene Session ohne Activity
  anlegen → wird als verpasst angezeigt

### D3 — Meilenstein-Fortschritt + Verlauf-Chart
- Anzeige: aktuelle Bestzeit vs. nächster Meilenstein
- Einfaches Pace-Trend-Chart der letzten Aktivitäten
- **Akzeptanz:** Chart zeigt reale Daten aus `Activity`, aktualisiert sich
  nach neuem Sync (Spec 4, AC 3)
