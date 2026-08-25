# Tempora — Lauf-Coach-App — Projektkontext

> Dieses Dokument ist Claude Codes direkt geladener Projektkontext
> (Produktrahmen, fachlicher Hintergrund). Für portable Agent-Regeln
> (exakte Befehle, Quality Gates, Konventionen, Boundaries) ist
> [AGENTS.md](AGENTS.md) die kanonische Quelle, für Architektur
> [docs/architecture.md](docs/architecture.md), für nicht verhandelbare
> Invarianten [docs/constitution.md](docs/constitution.md). Bei
> Widersprüchen zwischen diesem Dokument und einer dieser Quellen gilt die
> jeweils spezialisierte Datei.

## Was ist das
Webapp für einen Trainingsplan fürs Laufen (aktuell: 5km unter 20min in 12
Monaten), Sync mit Strava (siehe ADR-0002), Dashboard mit Wochenplan/
Fortschritt, und ein Chat-Layer, über den der Plan angepasst werden kann.
Kein Chat-only-Interface — Dashboard ist die Hauptansicht, Chat ist Zusatz
(Vorbild: Runna, aber viel einfacher). v1 ist bewusst auf einen Nutzer
zugeschnitten (siehe "Nicht in Scope" in `docs/specs/00-fundament/tickets.md`), die Strava-OAuth-
Architektur ist aber grundsätzlich multi-user-fähig, falls das später
gewünscht wird.

## Tech-Stack & Architektur
Next.js (App Router, TypeScript) Frontend + API Routes, SQLite via Prisma,
Anthropic API für den Chat-Layer, Strava-Sync über OAuth + Webhooks (kein
Sidecar, siehe ADR-0002), Hosting Vercel Free Tier. Details, Modul-Map und
kritische Flows: [docs/architecture.md](docs/architecture.md).

## Konventionen, Befehle, Anti-Patterns
Kanonisch in [AGENTS.md](AGENTS.md) — dort auch der aktuelle Stand der
`[NEEDS CONFIRMATION]`-Lücken (z.B. Lint/Test-Setup, das erst mit Epic A1
entsteht). Nicht hier duplizieren.

## Fachlicher Hintergrund
Die Coaching-Logik (Progressionsraten, Schmerz-Ampel, Spike-Regel, Zonen-
Ableitung, Onboarding-Struktur) basiert auf einer strukturierten Recherche
mit Primärquellen (RCTs, Kohortenstudien, Meta-Analysen). Siehe
`docs/research/` — insbesondere relevant für die System-Prompts in
[Spec 3](docs/specs/03-onboarding/spec.md) (Onboarding) und
[Spec 5](docs/specs/05-chat-anpassung/spec.md) (Chat-Anpassung).

## Entscheidungen
Verbindliche Architektur-/Produktentscheidungen stehen als ADRs in
`docs/decisions/` (u.a. App-Name, Datenquelle Strava). Bei Widersprüchen
zwischen diesem Dokument und einer ADR gilt die ADR.
