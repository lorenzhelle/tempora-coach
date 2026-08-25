# Specs — Lauf-Coach-App

Format pro Feature: Ziel, Datenmodell (falls relevant), Acceptance Criteria im
EARS-Format (WHEN/IF/THE SYSTEM SHALL — maschinenlesbar für den Agenten und
direkt in Testfälle übersetzbar).

---

## Spec 1: Strava-Sync

**Ziel:** Läufe automatisch aus Strava (die Garmin-Uhr synct dorthin) in die
App-DB holen, ohne manuellen Export. Siehe ADR-0002 für die Begründung
Strava statt Garmin-Direktsync.

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

---

## Spec 2: Plan-Datenmodell

**Ziel:** Der Trainingsplan ist strukturiert in der DB, nicht nur Text.

**Datenmodell:**
```
Plan: id, goalDescription ("5km unter 20min"), startDate, targetDate,
      currentPhase (enum: basis | tempo | intervall | renn)

Milestone: id, planId, targetTimeSeconds, label ("unter 25min"),
           targetDate (nullable), achievedDate (nullable)

TrainingWeek: id, planId, weekNumber, startDate, endDate, phase, notes

PlannedSession: id, trainingWeekId, dayOfWeek, type (enum: locker | tempo |
                intervall | kraft | rest | testlauf), targetDurationMin
                (nullable), targetDistanceKm (nullable), targetPace
                (nullable), description, completed (bool),
                linkedActivityId (nullable, FK zu Activity)
```

**Acceptance Criteria:**
- WHEN ein Plan erstellt wird, THE SYSTEM SHALL mindestens einen `Milestone`
  und die `TrainingWeek`-Einträge für die aktuelle Phase anlegen.
- WHEN eine Strava-Aktivität einer `PlannedSession` zeitlich/inhaltlich
  entspricht, THE SYSTEM SHALL sie verknüpfen können (manuell oder
  vorgeschlagen) und `completed = true` setzen.
- IF ein Milestone-Zieldatum erreicht ist und die letzte Testlauf-Zeit unter
  dem Zielwert liegt, THEN THE SYSTEM SHALL `achievedDate` setzen.

---

## Spec 3: Onboarding — Plan-Erstellung im Chat

**Ziel:** Erster Plan entsteht im geführten Chat-Dialog (wie in diesem
Claude-Chat besprochen), nicht über ein Formular.

**Ablauf:**
1. Chat fragt (falls nicht bekannt): Zieldistanz/-zeit, aktuelle Form (PB oder
   geschätztes Tempo), Zeitrahmen, Trainingstage/Woche verfügbar.
2. Claude generiert einen Plan-Vorschlag (Phasen + erste Wochen konkret,
   spätere Phasen grob) als strukturiertes JSON passend zum Datenmodell aus
   Spec 2.
3. Nutzer bestätigt oder bittet um Anpassung (z.B. anderes Startdatum) —
   iterativ, bis der Plan final ist.
4. Bei Bestätigung: Plan wird in der DB angelegt.

**Acceptance Criteria:**
- WHEN der Nutzer im Onboarding-Chat alle nötigen Eckdaten gegeben hat, THE
  SYSTEM SHALL einen vollständigen Plan-Vorschlag als strukturierte Daten
  zurückgeben (nicht nur Fließtext).
- IF Eckdaten fehlen (z.B. kein Zeitrahmen genannt), THEN THE SYSTEM SHALL
  gezielt nachfragen, bevor ein Plan generiert wird.
- WHEN der Nutzer den Vorschlag bestätigt, THE SYSTEM SHALL den Plan
  persistent in der DB speichern.
- WHEN der Nutzer vor Bestätigung eine Änderung wünscht, THE SYSTEM SHALL den
  Vorschlag anpassen, ohne bereits bestätigte Teile zu verwerfen.

---

## Spec 4: Dashboard

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

---

## Spec 5: Chat-basierte Plan-Anpassung

**Ziel:** Nutzer kann jederzeit per Chat Rückfragen stellen oder Anpassungen
anfordern ("war zu hart", "muss Woche verschieben", "Knie zwickt").

**Kontext, das Claude pro Anfrage bekommt:**
- Aktueller Plan-Stand (JSON, Spec 2)
- Letzte N Aktivitäten (Spec 1)
- System-Prompt mit Coaching-Logik (Trainingsprinzipien, siehe
  `docs/research/` — insbesondere Schmerz-Ampel-Modell und die RUNSAFE-
  Spike-Regel für Sicherheits-Checks)

**Acceptance Criteria:**
- WHEN der Nutzer im Chat eine Anpassung anfragt, THE SYSTEM SHALL den
  relevanten Teil des Plans identifizieren und gezielt ändern (nicht den
  gesamten Plan neu schreiben).
- WHEN eine Plan-Änderung vorgenommen wurde, THE SYSTEM SHALL sie im
  Dashboard sofort sichtbar machen.
- IF die Anfrage nur eine Frage ist (keine Änderung gewünscht), THEN THE
  SYSTEM SHALL antworten, ohne den Plan zu verändern.
- WHEN eine Anpassung angefragt wird, die den Trainingsprinzipien widerspricht
  (z.B. ein Einzellauf, der stark über den längsten Lauf der letzten 30 Tage
  springt — siehe RUNSAFE-Befund in `docs/research/`), THEN THE SYSTEM SHALL
  darauf hinweisen, bevor es die Änderung übernimmt.
