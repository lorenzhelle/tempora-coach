# ADR-0002: Datenquelle für Lauf-Aktivitäten — Strava statt Garmin-Direktsync

## Status
Entschieden — 2026-08-25 (löst die ursprüngliche Annahme "Garmin via
inoffizielle Library + Python-Sidecar" ab, wie sie zuerst in
CLAUDE.md/SPECS.md/TICKETS.md stand)

## Kontext
Zwei Optionen wurden evaluiert, um Laufdaten von der Garmin-Uhr in die App
zu bekommen:

1. **Direkt via `python-garminconnect`** (inoffizielle Library, Login mit
   Garmin-E-Mail/Passwort über einen Python-Sidecar). Funktioniert technisch,
   aber: kein offizieller Support, Login-Flow kann durch Garmin-seitige
   Änderungen jederzeit brechen (MFA-Handling, Rate-Limits), und für
   zukünftige weitere Nutzer müsste man deren Garmin-Passwort zentral
   speichern — nicht vertretbar, sobald mehr als der Betreiber selbst die App
   nutzt.
2. **Strava als Relay via offizieller OAuth-API.** Garmin Connect synct
   Aktivitäten automatisch zu Strava. Jeder Nutzer verbindet per OAuth sein
   eigenes Strava-Konto — kein Passwort-Teilen. Echte Webhooks für neue
   Aktivitäten (eine App-weite Subscription für alle Nutzer). Standard-Tier
   erlaubt bis zu 10 verbundene Athleten ohne formale Prüfung. Seit 1. Juni
   2026 ist eine aktive Strava-Mitgliedschaft (11,99 $/Monat) Pflicht für
   API-Zugang — das zahlt der App-Betreiber pro App, nicht jeder Nutzer
   einzeln.

**Trade-off, bewusst in Kauf genommen:** Garmin-exklusive Metriken
(HRV-Status, Body Battery, Training Load/Status — Firstbeat-Analytics)
kommen über Strava nicht durch, nur Basis-Laufdaten (Pace, Distanz, Dauer,
Herzfrequenz, GPS, Splits). Für den Plan-Kern (Zonen, Umfangs-Progression,
Fortschritt, Schmerz-Ampel-Checkins, Spike-Regel aus der Recherche in
`docs/research/`) reicht das vollständig aus.

Apple Health wurde ebenfalls geprüft: kein Cloud-/REST-API, nur
geräteseitiges Framework — für eine Web-App ohne native Begleit-App oder
Shortcuts-Automation kein gangbarer Weg. Bleibt als möglicher iOS-exklusiver
Zusatzkanal für die Zukunft, ist aber kein Ersatz für Strava.

## Entscheidung
Datenquelle ist **Strava**, angebunden über die offizielle OAuth-API +
Webhooks. Kein Python-Sidecar mehr — der Sync läuft direkt als Next.js
API-Route (OAuth-Connect-Flow + Webhook-Handler).

## Konsequenzen
- Neues Datenmodell `StravaConnection` (userId, stravaAthleteId,
  accessToken, refreshToken, expiresAt) statt Garmin-Login-Credentials in
  `.env`.
- `Activity.garminActivityId` wird zu `Activity.stravaActivityId`.
- Architektur vereinfacht sich: kein separater Sidecar-Host/Cronjob-Prozess
  mehr nötig. Spec 1 und Epic B in `SPECS.md`/`TICKETS.md` sind entsprechend
  auf Strava umgestellt (Details dort, nicht hier dupliziert).
- Laufende Kosten: 11,99 $/Monat für den Strava-API-Zugang (Betreiber
  zahlt, nicht die einzelnen Nutzer).
- Architektur ist durch OAuth-pro-Nutzer grundsätzlich multi-user-fähig,
  auch wenn v1 weiterhin bewusst nur für einen Nutzer live geschaltet wird
  (siehe "Nicht in Scope" in `TICKETS.md`) — das ist eine separate, noch
  offene Entscheidung, keine Folge dieser ADR.
- Firstbeat-Analytics (HRV, Body Battery, Training Load) stehen nicht zur
  Verfügung. Falls später gewünscht: separates, optionales Zusatzfeature,
  nicht Teil von v1.
