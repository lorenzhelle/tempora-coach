# Spec 1: Strava-Sync

**Ziel:** Läufe automatisch aus Strava (die Garmin-Uhr synct dorthin) in die
App-DB holen, ohne manuellen Export. Siehe [ADR-0002](../../decisions/0002-datenquelle-strava.md)
für die Begründung Strava statt Garmin-Direktsync.

**Ansatz:** Offizielle Strava-OAuth-API. Einmaliger Connect-Flow pro Nutzer
(OAuth-Redirect, Access-/Refresh-Token speichern), danach Webhook-Endpoint,
der bei neuen/geänderten Aktivitäten von Strava benachrichtigt wird.
Periodischer Abgleich (z.B. täglich) als Fallback, falls ein Webhook-Event
verloren geht.

**Datenmodell `StravaConnection`:**
```
id, userId, stravaAthleteId, accessToken, refreshToken, expiresAt
```

**Datenmodell `Activity`:**
```
id, stravaActivityId (unique), date, distanceKm, durationSeconds,
avgPaceSecPerKm, avgHeartRate (nullable), splits (JSON: pro-km Pace),
feltEffort (nullable, manuell nachtragbar 1-10), notes (nullable)
```

**Acceptance Criteria:**
- WHEN ein Nutzer den Strava-Connect-Flow abschließt, THE SYSTEM SHALL
  Access-Token, Refresh-Token und Ablaufzeit in `StravaConnection` speichern.
- WHEN ein Strava-Webhook-Event für eine neue Aktivität eintrifft, THE SYSTEM
  SHALL die Aktivität abrufen und als `Activity`-Eintrag speichern.
- IF eine Strava-Aktivität bereits in der DB existiert (gleiche
  `stravaActivityId`), THEN THE SYSTEM SHALL sie nicht doppelt anlegen.
- WHEN ein Access-Token abgelaufen ist, THE SYSTEM SHALL es automatisch via
  Refresh-Token erneuern, bevor ein API-Aufruf fehlschlägt.
- IF der Refresh-Token ungültig ist (Nutzer hat Zugriff in Strava widerrufen),
  THEN THE SYSTEM SHALL den Fehler loggen, die Verbindung als getrennt
  markieren und den nächsten Sync-Versuch für andere Nutzer nicht blockieren.
- WHEN eine neue Aktivität gespeichert wurde, THE SYSTEM SHALL sie dem
  Dashboard und dem Chat-Kontext zur Verfügung stellen.
