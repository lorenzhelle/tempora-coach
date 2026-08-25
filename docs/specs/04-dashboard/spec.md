# Spec 4: Dashboard

**Ziel:** Hauptansicht der App — zeigt aktuellen Wochenplan, nächste Einheit,
Fortschritt zu den Meilensteinen.

**Views:**
- Wochenübersicht: alle `PlannedSession` der aktuellen Woche, Status
  (offen/erledigt/verpasst)
- Nächste Einheit: hervorgehoben, mit Details (Typ, Ziel-Pace/-Dauer)
- Meilenstein-Fortschritt: aktuelle Bestzeit vs. nächster Meilenstein
- Verlauf: letzte Aktivitäten mit Pace-Trend (einfaches Chart)

**Acceptance Criteria:**
- WHEN das Dashboard geladen wird, THE SYSTEM SHALL die aktuelle
  `TrainingWeek` basierend auf dem heutigen Datum bestimmen und anzeigen.
- IF eine `PlannedSession` in der Vergangenheit liegt und keine verknüpfte
  Aktivität hat, THEN THE SYSTEM SHALL sie als "verpasst" markieren.
- WHEN eine neue Strava-Aktivität synced wurde, THE SYSTEM SHALL das
  Dashboard beim nächsten Laden aktualisiert anzeigen (kein manueller Refresh
  nötig).
