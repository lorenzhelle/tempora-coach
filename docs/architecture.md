# Architecture

## Status

Dieses Dokument beschreibt den **aktuellen** Stand, nicht ein Wunschbild.
Stand jetzt existiert im Repository noch kein Code — die hier beschriebene
Architektur ist die in [CLAUDE.md](../CLAUDE.md), den Specs unter
[docs/specs/](specs/README.md) und den ADRs in
[docs/decisions/](decisions/README.md) verbindlich festgelegte
**Zielarchitektur für die Implementierung**, noch nicht verifizierter
Ist-Zustand eines laufenden Systems. Dieses Dokument MUSS aktualisiert
werden, sobald [00-fundament](specs/00-fundament/tickets.md) umgesetzt ist,
damit es wieder die reale Struktur statt der Planung beschreibt.

## System context

Tempora ist eine Single-App-Webanwendung (kein Microservice-Verbund). Externe
Abhängigkeiten:

- **Strava-API** (OAuth + Webhooks) als einzige Datenquelle für
  Lauf-Aktivitäten — siehe [ADR-0002](decisions/0002-datenquelle-strava.md).
- **Anthropic API (Claude)** für den Chat-Layer (Onboarding-Dialog und
  Plan-Anpassungen), inkl. Tool Use für strukturierte Plan-Updates.
- **SQLite** als einzige Datenhaltung (kein externer DB-Server für v1).

## Module map (geplant)

```
repository/
├── app/                    Next.js App Router — UI-Routen (Dashboard, Chat, Onboarding)
├── app/api/                Next.js API Routes — einziger Weg, Plan-Daten zu mutieren
│   ├── strava/oauth/       OAuth-Connect-Flow (Spec 1)
│   ├── strava/webhook/     Webhook-Endpoint für neue Aktivitäten (Spec 1)
│   └── chat/               Anthropic-Anbindung, Tool-Definitionen (Spec 3, Spec 5)
├── prisma/                 Schema + Migrationen (Spec 2 Datenmodell)
└── lib/                    geteilte Business-Logik (Plan-Regeln, Trainingsprinzipien-Check)
```

`[NEEDS CONFIRMATION: exakte Ordnerstruktur wird erst mit Epic A1
verifiziert und muss dann hier nachgezogen werden]`

## Data model

Das Plan-Datenmodell (`Plan`, `Milestone`, `TrainingWeek`, `PlannedSession`,
`Activity`, `StravaConnection`) ist in
[Spec 1](specs/01-strava-sync/spec.md) und
[Spec 2](specs/02-plan-datenmodell/spec.md) vollständig spezifiziert — hier
nicht dupliziert, siehe dort.

## Critical flows

1. **Strava-Sync** (Spec 1): Strava-Webhook-Event → API Route ruft Aktivität
   von der Strava-API ab → dedupliziert über `stravaActivityId` → speichert
   als `Activity` → steht Dashboard und Chat-Kontext zur Verfügung.
2. **Onboarding** (Spec 3): Chat erfragt Eckdaten → Claude generiert
   strukturierten Plan-Vorschlag (JSON) → Nutzer bestätigt → Plan wird in
   `Plan`/`Milestone`/`TrainingWeek`/`PlannedSession` persistiert.
3. **Chat-Anpassung** (Spec 5): Nutzer-Anfrage im Chat → Claude bekommt
   aktuellen Plan-Stand + letzte Aktivitäten als Kontext → identifiziert
   betroffenes Feld → prüft gegen Trainingsprinzipien (Spike-Regel, siehe
   `docs/research/`) → ändert gezielt, warnt bei Verstoß statt still zu
   übernehmen.

## Cross-cutting concerns

- **Konsistenz:** Plan-Mutationen laufen ausschließlich über API-Routes,
  nie direkt aus Frontend-Code (siehe `docs/constitution.md` DATA-001).
- **Sicherheit:** Strava-Tokens werden verschlüsselt/serverseitig gehalten,
  nie im Client-Code oder Logs (siehe `docs/constitution.md` SEC-001).
- **Resilienz:** Strava-Sync über Webhooks mit periodischem Fallback-Abgleich
  (Ticket B4), damit verlorene Webhook-Events nicht zu fehlenden Aktivitäten
  führen.

## ADR index

Verbindliche Architekturentscheidungen stehen als ADRs in
[docs/decisions/](decisions/README.md):

- [ADR-0001](decisions/0001-app-name-tempora.md) — App-Name: Tempora
- [ADR-0002](decisions/0002-datenquelle-strava.md) — Datenquelle: Strava
  statt Garmin-Direktsync

## Related documentation

- Agent-Anweisungen: [AGENTS.md](../AGENTS.md)
- Invarianten: [docs/constitution.md](constitution.md)
- Betrieb: [docs/runbooks/runbook.md](runbooks/runbook.md)
- Feature-Specs: [docs/specs/](specs/README.md)

## Maintenance

Aktualisieren, sobald die Tickets unter `docs/specs/` umgesetzt werden und
die reale Struktur von der hier beschriebenen Planung abweicht, sowie bei
jeder neuen Architektur-ADR.
