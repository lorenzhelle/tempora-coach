# Tickets — Lauf-Coach-App

Reihenfolge = empfohlene Umsetzungsreihenfolge. Jedes Ticket ist klein genug,
um es einzeln an einen Coding-Agenten zu geben (ein Ticket = eine Session).

## Epic A: Fundament

### A1 — Projekt-Setup
- Next.js (App Router, TypeScript) Projekt aufsetzen
- SQLite + Prisma einrichten, `.env`-Handling für Secrets
- CLAUDE.md ins Repo-Root legen
- **Akzeptanz:** `npm run dev` startet eine leere Startseite, DB-Migration
  läuft fehlerfrei durch

### A2 — Datenmodell anlegen (Spec 2)
- Prisma-Schema für `Plan`, `Milestone`, `TrainingWeek`, `PlannedSession`,
  `Activity` gemäß Spec 2
- Migration erzeugen und lokal testen
- **Akzeptanz:** Alle Modelle aus Spec 2 existieren als Tabellen, Relationen
  funktionieren (z.B. `PlannedSession.linkedActivityId` → `Activity`)

## Epic B: Garmin-Sync (Spec 1)

### B1 — Garmin-Sidecar Grundgerüst
- Python/FastAPI-Projekt, `python-garminconnect` + `curl_cffi` einbinden
- Login-Flow inkl. MFA-Handling, Token-Caching lokal testen
- Endpoint `GET /activities/recent` gibt letzte Aktivitäten als JSON zurück
- **Akzeptanz:** Lokaler Aufruf des Endpoints liefert echte Garmin-Aktivitäten

### B2 — Sync-Job: Garmin → DB
- Next.js API Route oder Cronjob, der den Sidecar-Endpoint abfragt und neue
  Aktivitäten in `Activity` speichert
- Dedupe über `garminActivityId` (Spec 1, AC 2)
- **Akzeptanz:** Zweimaliges Ausführen des Sync-Jobs erzeugt keine Duplikate

### B3 — Fehlerbehandlung Sync
- Fehlerfall (Token abgelaufen, Netzwerkfehler) sauber loggen, Job bricht
  nicht komplett ab (Spec 1, AC 3)
- **Akzeptanz:** Simulierter Login-Fehler blockiert nachfolgende Syncs nicht

## Epic C: Onboarding-Chat (Spec 3)

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

## Epic D: Dashboard (Spec 4)

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

## Epic E: Chat-Anpassungen (Spec 5)

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

---

## Nicht in Scope (bewusst zurückgestellt)
- Workout-Push zurück aufs Garmin-Gerät (Training API / Connect IQ)
- Mehrbenutzer-Fähigkeit / Auth-System (siehe `docs/research/` für eine
  spätere Multi-User-Option über Strava-OAuth, falls Friends&Family-Nutzung
  gewünscht wird — für v1 bewusst nicht umgesetzt)
- Strava als Alternativ-Datenquelle (für v1 verworfen zugunsten Garmin direkt;
  offene Option für eine mögliche Multi-User-Erweiterung, siehe
  `docs/research/`)
