# Runbook: Tempora

## Ownership and metadata

- Scope: Gesamte Tempora-Webapp (Next.js-App + Strava-Sync), sobald deployed
- Owner: `[NEEDS CONFIRMATION: formaler Owner — aktuell einziger
  Betreiber/Nutzer des Projekts]`
- Escalation owner: `[NEEDS CONFIRMATION: kein zweites Teammitglied, da
  Einzelnutzer-Projekt]`
- Kritikalität: `[NEEDS CONFIRMATION: noch nicht klassifiziert — kein
  Produktivbetrieb vorhanden]`
- Zuletzt verifiziert: 2026-08-25 — **Status: Es existiert noch kein
  Deployment.** Diese Prozeduren sind noch nicht getestet.
- Review-Kadenz: `[NEEDS CONFIRMATION]`

## Purpose and limits

Dieses Runbook soll den Betrieb der Tempora-App abdecken, sobald sie deployed
ist (Vercel Free Tier, siehe `docs/architecture.md`). **Aktueller Stand:**
Das Repository enthält noch keinen Code (`docs/specs/00-fundament/tickets.md`
ist noch nicht umgesetzt) — es gibt keine laufende Instanz, keine Dashboards, keine
Alerts. Dieser Abschnitt und die folgenden MÜSSEN mit echten, verifizierten
Werten befüllt werden, sobald ein erstes Deployment existiert, statt
plausible aber unverifizierte Prozeduren zu veröffentlichen.

## Access and safety prerequisites

- Erforderlicher Zugriff: `[NEEDS CONFIRMATION: Vercel-Projekt-Zugriff,
  Strava-App-Dashboard-Zugriff — noch nicht eingerichtet]`
- Erforderliche Tools: `[NEEDS CONFIRMATION]`
- Freigabe-Gates: siehe `docs/constitution.md` ("Human vs. agent approval
  gates") — destruktive Operationen (DB-Reset, Force-Push) erfordern
  menschliche Freigabe
- Secret-Handling: Secrets liegen in Vercel Environment Variables bzw.
  lokaler `.env` (nie im Git-Repo, siehe `docs/constitution.md` SEC-001) —
  konkrete Werte NIEMALS in dieses Dokument eintragen
- Stop-Bedingungen: `[NEEDS CONFIRMATION]`

## Signals and healthy state

| Signal | Location | Healthy state | Owner |
| --- | --- | --- | --- |
| `[NEEDS CONFIRMATION: noch kein Deployment, noch keine Monitoring-Signale]` | — | — | — |

Sobald deployed: mindestens Vercel-Deployment-Status, Strava-Webhook-
Zustellrate (fehlgeschlagene Events), und Fehlerrate der API-Routes als
Minimal-Signale ergänzen.

## Routine operations

### Deployment

`[NEEDS CONFIRMATION: Deployment-Prozess noch nicht eingerichtet — geplant:
Vercel Git-Integration auf den Default-Branch, siehe docs/architecture.md]`

### Strava-Webhook-Subscription erneuern/prüfen

`[NEEDS CONFIRMATION: Prozedur folgt mit Ticket B2 aus
docs/specs/01-strava-sync/tickets.md, sobald der Webhook-Endpoint existiert]`

## Diagnostics

### Strava-Sync liefert keine neuen Aktivitäten

1. Prüfen, ob die Strava-Webhook-Subscription aktiv ist —
   `[NEEDS CONFIRMATION: genauer Check-Befehl/Endpoint folgt mit Ticket B2]`
2. Prüfen, ob `StravaConnection.expiresAt` in der Vergangenheit liegt
   (abgelaufenes Token, das nicht automatisch erneuert wurde — Verstoß
   gegen `docs/constitution.md` SEC-002)
3. Fallback-Abgleich (Ticket B4) manuell auslösen, um zu prüfen, ob es sich
   um ein verlorenes Webhook-Event handelt

### Chat generiert keinen/fehlerhaften Plan-Vorschlag

1. Prüfen, ob der Anthropic-API-Key gültig ist
2. Prüfen, ob die Tool-Definition (Spec 3) mit dem aktuellen Prisma-Schema
   (Spec 2) übereinstimmt

## Mitigation

`[NEEDS CONFIRMATION: konkrete Mitigation-Prozeduren folgen, sobald ein
erstes Deployment existiert und reale Fehlerbilder bekannt sind]`

## Validation

Nach jeder Operation/Mitigation:

1. `[NEEDS CONFIRMATION: primäres Health-Signal]`
2. Bestätigen, dass keine doppelten `Activity`-Einträge entstanden sind
   (siehe `docs/constitution.md` DATA-002)
3. Bestätigen, dass der Trainingsplan in der DB konsistent ist (keine
   verwaisten `PlannedSession`-Einträge ohne `TrainingWeek`)

## Rollback and recovery

- Trigger: `[NEEDS CONFIRMATION]`
- Known-good reference: letzter erfolgreicher Vercel-Deployment (Git-Commit)
- Prozedur: `[NEEDS CONFIRMATION: Vercel-Rollback-Mechanismus noch nicht
  verifiziert]`
- Daten-Schutzmaßnahmen: SQLite-Backup vor jeder Schema-Migration
  `[NEEDS CONFIRMATION: konkreter Backup-Mechanismus noch nicht
  eingerichtet]`

## Escalation

| Trigger | Route | Information |
| --- | --- | --- |
| `[NEEDS CONFIRMATION: kein Eskalationsprozess definiert — Einzelnutzer-Projekt]` | — | — |

## Communication

`[NEEDS CONFIRMATION: kein Stakeholder-Kreis außer dem Betreiber selbst]`

## Post-incident follow-up

- Timeline und Ursache festhalten, sobald ein erster Vorfall auftritt
- Bei einer wiederkehrenden Ursache: neue ADR oder Constitution-Invariante
  in Erwägung ziehen (siehe `docs/decisions/README.md`)

## Related documentation

- Agent-Anweisungen und Entwicklungs-Gates: [AGENTS.md](../../AGENTS.md)
- Nicht verhandelbare Invarianten: [docs/constitution.md](../constitution.md)
- Architektur und Abhängigkeiten: [docs/architecture.md](../architecture.md)
- Entscheidungshistorie: [docs/decisions/README.md](../decisions/README.md)

## Maintenance

Dieses Runbook MUSS überarbeitet werden, sobald das erste Deployment
existiert — die `[NEEDS CONFIRMATION]`-Platzhalter sind dann durch
verifizierte Werte zu ersetzen, nicht durch plausible Annahmen. Danach:
Update nach jedem Vorfall, jeder Zugriffs-/Signal-Änderung und bei jeder
Deployment- oder Abhängigkeitsänderung.
