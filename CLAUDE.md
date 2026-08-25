# Tempora — Lauf-Coach-App — Projektkontext

## Was ist das
Persönliche Webapp (nur für einen Nutzer, kein Multi-Tenant). Ziel: Trainingsplan
fürs Laufen (aktuell: 5km unter 20min in 12 Monaten), Sync mit Garmin, Dashboard
mit Wochenplan/Fortschritt, und ein Chat-Layer, über den der Plan angepasst
werden kann. Kein Chat-only-Interface — Dashboard ist die Hauptansicht, Chat ist
Zusatz (Vorbild: Runna, aber viel einfacher, kostenlos für den einen Nutzer).

## Tech-Stack
- Frontend: Next.js (App Router) + TypeScript
- Backend: Next.js API Routes für App-Logik; kleiner Python-Sidecar (FastAPI)
  nur für den Garmin-Sync via `python-garminconnect` (+ `curl_cffi`)
- DB: SQLite (ein Nutzer, kein Skalierungsbedarf) — via Prisma o.ä.
- LLM: Anthropic API (Claude), Tool Use für strukturierte Plan-Updates
- Hosting: Vercel Free Tier (Frontend) + kleiner Cronjob/Container für den
  Garmin-Sidecar (z.B. Fly.io free tier oder Raspberry Pi / eigener Homeserver)

## Architektur-Prinzipien
- Plan ist ein **strukturiertes Datenmodell in der DB**, nicht nur Text im
  Chatverlauf. Chat-Anpassungen ändern gezielt Felder, nicht den ganzen Plan.
- Garmin-Sync läuft **asynchron im Hintergrund** (Cronjob), nicht bei jedem
  Seitenaufruf. Dashboard liest aus der DB, nicht live von Garmin.
- Claude bekommt bei jeder Chat-Anfrage: aktuellen Plan-Stand (JSON) + relevante
  Lauf-Historie als Tool-Ergebnisse. Antwort ist entweder reiner Text oder
  Text + strukturiertes Plan-Update.
- Kein Multi-User-Gedöns (kein Auth-System nötig, ggf. einfacher Passwortschutz
  reicht für Deployment).

## Konventionen
- TypeScript strict mode
- Kommentare/Doku auf Deutsch (Codebase ist persönliches Projekt)
- Variablennamen/Code selbst auf Englisch (Standard-Konvention)

## Befehle
- `npm run dev` — Next.js Dev-Server
- `npm run build` — Production Build
- (Sidecar) `uvicorn main:app --reload` — Garmin-Sync-Service lokal

## Anti-Patterns / worauf achten
- Keine Business-Logik im Frontend, die eigentlich Plan-Daten mutiert — immer
  über die API-Route, damit die DB konsistent bleibt
- Nicht bei jeder Chat-Nachricht den kompletten Plan neu generieren — nur
  gezielt die betroffenen Felder ändern
- Garmin-Login-Zugangsdaten niemals ins Repo — `.env`, nicht committen
- Nicht auf offizielle Garmin-API warten/setzen — die ist business-only und
  aktuell für neue Anmeldungen pausiert

## Fachlicher Hintergrund
Die Coaching-Logik (Progressionsraten, Schmerz-Ampel, Spike-Regel, Zonen-
Ableitung, Onboarding-Struktur) basiert auf einer strukturierten Recherche
mit Primärquellen (RCTs, Kohortenstudien, Meta-Analysen). Siehe
`docs/research/` — insbesondere relevant für die System-Prompts in Spec 3
(Onboarding) und Spec 5 (Chat-Anpassung) aus `SPECS.md`.
