# Tempora — Lauf-Coach-App — Projektkontext

## Was ist das
Webapp für einen Trainingsplan fürs Laufen (aktuell: 5km unter 20min in 12
Monaten), Sync mit Strava (siehe ADR-0002), Dashboard mit Wochenplan/
Fortschritt, und ein Chat-Layer, über den der Plan angepasst werden kann.
Kein Chat-only-Interface — Dashboard ist die Hauptansicht, Chat ist Zusatz
(Vorbild: Runna, aber viel einfacher). v1 ist bewusst auf einen Nutzer
zugeschnitten (siehe "Nicht in Scope" in `TICKETS.md`), die Strava-OAuth-
Architektur ist aber grundsätzlich multi-user-fähig, falls das später
gewünscht wird.

## Tech-Stack
- Frontend: Next.js (App Router) + TypeScript
- Backend: Next.js API Routes für App-Logik inkl. Strava-OAuth-Connect-Flow
  und Webhook-Endpoint für neue Aktivitäten (kein separater Sidecar nötig,
  siehe ADR-0002)
- DB: SQLite (v1: ein Nutzer, kein Skalierungsbedarf) — via Prisma o.ä.
- LLM: Anthropic API (Claude), Tool Use für strukturierte Plan-Updates
- Hosting: Vercel Free Tier reicht — kein separater Cronjob-Host mehr nötig,
  da Strava-Sync über Webhooks läuft statt über einen periodisch laufenden
  Sidecar

## Architektur-Prinzipien
- Plan ist ein **strukturiertes Datenmodell in der DB**, nicht nur Text im
  Chatverlauf. Chat-Anpassungen ändern gezielt Felder, nicht den ganzen Plan.
- Strava-Sync läuft **über Webhooks** (Strava pusht neue Aktivitäten), nicht
  bei jedem Seitenaufruf. Dashboard liest aus der DB, nicht live von Strava.
- Claude bekommt bei jeder Chat-Anfrage: aktuellen Plan-Stand (JSON) + relevante
  Lauf-Historie als Tool-Ergebnisse. Antwort ist entweder reiner Text oder
  Text + strukturiertes Plan-Update.
- v1: kein Multi-User-Auth-System nötig (ein Nutzer, ggf. einfacher
  Passwortschutz reicht fürs Deployment) — auch wenn Strava-OAuth technisch
  mehrere Nutzer erlauben würde.

## Konventionen
- TypeScript strict mode
- Kommentare/Doku auf Deutsch (Codebase ist persönliches Projekt)
- Variablennamen/Code selbst auf Englisch (Standard-Konvention)

## Befehle
- `npm run dev` — Next.js Dev-Server
- `npm run build` — Production Build

## Anti-Patterns / worauf achten
- Keine Business-Logik im Frontend, die eigentlich Plan-Daten mutiert — immer
  über die API-Route, damit die DB konsistent bleibt
- Nicht bei jeder Chat-Nachricht den kompletten Plan neu generieren — nur
  gezielt die betroffenen Felder ändern
- Strava Access-/Refresh-Tokens niemals ins Repo/in Logs — verschlüsselt oder
  zumindest in `.env`/DB, nicht committen
- Refresh-Token-Handling nicht vergessen: Strava-Access-Tokens laufen nach
  6h ab, Refresh muss automatisch passieren, nicht erst wenn ein Sync
  fehlschlägt

## Fachlicher Hintergrund
Die Coaching-Logik (Progressionsraten, Schmerz-Ampel, Spike-Regel, Zonen-
Ableitung, Onboarding-Struktur) basiert auf einer strukturierten Recherche
mit Primärquellen (RCTs, Kohortenstudien, Meta-Analysen). Siehe
`docs/research/` — insbesondere relevant für die System-Prompts in Spec 3
(Onboarding) und Spec 5 (Chat-Anpassung) aus `SPECS.md`.

## Entscheidungen
Verbindliche Architektur-/Produktentscheidungen stehen als ADRs in
`docs/decisions/` (u.a. App-Name, Datenquelle Strava). Bei Widersprüchen
zwischen diesem Dokument und einer ADR gilt die ADR.
