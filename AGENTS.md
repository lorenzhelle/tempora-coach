# AGENTS.md

## Scope

Diese Anweisungen gelten für das gesamte Repository `tempora-coach` (Produktname:
Tempora). Es gibt aktuell keine nested `AGENTS.md`-Dateien.

## Read order

1. Dieses `AGENTS.md` für ausführbare Arbeitsregeln.
2. `docs/constitution.md` für nicht verhandelbare Invarianten.
3. Das aufgabenrelevante Dokument: `docs/architecture.md`, `SPECS.md`,
   `TICKETS.md`, `docs/runbooks/runbook.md` oder `docs/decisions/README.md`.
4. `CLAUDE.md` für erzählerischen Projektkontext (Produktrahmen, fachlicher
   Hintergrund) — ergänzt dieses Dokument, ersetzt es nicht.

## Working directory and setup

- Repository-Root: `/` (Next.js-Projekt wird direkt im Root angelegt, siehe
  `TICKETS.md` Epic A1)
- Voraussetzungen: `[NEEDS CONFIRMATION: Node.js-Version — noch nicht
  festgelegt, da Epic A1 "Projekt-Setup" noch nicht durchgeführt wurde]`
- Install/Bootstrap: `[NEEDS CONFIRMATION: noch kein package.json im Repo —
  wird mit Epic A1 angelegt]`
- Environment-Vorbereitung: `.env` für Secrets (Strava Client-ID/Secret,
  Anthropic API-Key) — Details siehe `docs/constitution.md`

## Exact commands

Stand: Das Repo enthält noch keinen Code (kein `package.json`, keine CI-
Konfiguration). Die folgenden Befehle sind der in `CLAUDE.md` festgehaltene
Plan, aber noch nicht verifiziert lauffähig.

| Zweck | Befehl | Erwartetes Ergebnis |
| --- | --- | --- |
| Dev-Server | `npm run dev` | Next.js Dev-Server startet (Epic A1) |
| Build | `npm run build` | Production Build ohne Fehler (Epic A1) |
| Format | `[NEEDS CONFIRMATION: kein Formatter konfiguriert]` | — |
| Lint | `[NEEDS CONFIRMATION: kein Linter konfiguriert]` | — |
| Typecheck | `[NEEDS CONFIRMATION: TypeScript strict mode ist vereinbart,
  aber kein `tsc`-Skript existiert bisher]` | — |
| Fokussierter Test | `[NEEDS CONFIRMATION: kein Test-Framework gewählt]` | — |
| Vollständiger Test | `[NEEDS CONFIRMATION: kein Test-Framework gewählt]` | — |
| DB-Migration | `[NEEDS CONFIRMATION: Prisma vereinbart, Schema/Migration
  noch nicht angelegt — Epic A2]` | — |

**Sobald Epic A1/A2 abgeschlossen sind, MUSS diese Tabelle mit den echten
Befehlen aktualisiert werden.**

## Quality gates

Vor einer Fertig-Meldung, sobald Code existiert:

- `[NEEDS CONFIRMATION: Formatierung/Format-Check-Befehl]`
- `[NEEDS CONFIRMATION: Statische Analyse/Lint-Befehl]`
- `[NEEDS CONFIRMATION: Tests für den geänderten Scope]`
- Build erfolgreich (`npm run build`), sobald Epic A1 steht
- Prisma-Migration läuft fehlerfrei durch, sobald Epic A2 steht
- Fehlende Gates (weil noch nicht eingerichtet) müssen im Abschlussbericht
  explizit benannt werden, nicht stillschweigend übersprungen werden

## Conventions

- Sprache/Runtime: TypeScript (strict mode), Next.js App Router — genaue
  Versionen `[NEEDS CONFIRMATION, wird mit Epic A1 festgelegt]`
- Formatierung: `[NEEDS CONFIRMATION: kein Formatter/Style-Guide gewählt]`
- Benennung: Code/Variablennamen auf Englisch (Standard-Konvention);
  Kommentare/Doku auf Deutsch (persönliches Projekt), siehe `CLAUDE.md`
- Testing: `[NEEDS CONFIRMATION: wann Tests Pflicht sind und wo sie liegen —
  noch nicht entschieden]`
- Dependencies: `[NEEDS CONFIRMATION: Freigabe-/Lockfile-Regeln noch nicht
  definiert]`
- Generierte Dateien: Prisma-Client/Migrations-Output ist generiert, nicht
  von Hand editieren (sobald Epic A2 steht)

## Boundaries and approvals

- Nie Business-Logik im Frontend, die Plan-Daten mutiert — immer über die
  API-Route (`docs/constitution.md` Invariante DATA-001)
- Nie den kompletten Trainingsplan bei jeder Chat-Nachricht neu generieren —
  nur die betroffenen Felder gezielt ändern
- Nie Strava-Access-/Refresh-Tokens oder andere Secrets ins Repo oder in Logs
  committen (`docs/constitution.md` Invariante SEC-001)
- Menschliche Freigabe einholen vor: Merge in den Default-Branch, jeder
  Schema-Migration, die bestehende Daten betrifft, und jeder Änderung an
  Trainingsprinzipien-Regeln (Spike-Regel, Schmerz-Ampel-Schwellen)
- Siehe `docs/constitution.md` für die vollständige Invariantenliste

## Nested AGENTS.md precedence

- Root-Regeln gelten repository-weit.
- Es existieren aktuell keine nested `AGENTS.md`-Dateien.

## Task routing

| Aufgabe | Erforderliches Dokument |
| --- | --- |
| Architektur-Änderung | `docs/architecture.md` + neue ADR in `docs/decisions/` |
| Betriebs-/Deployment-Änderung | `docs/runbooks/runbook.md` |
| Produkt-/Scope-Frage | `CLAUDE.md` ("Was ist das") + `docs/decisions/README.md` |
| Neues Feature/Spec | `SPECS.md` (EARS-Acceptance-Criteria) |
| Umsetzungsreihenfolge | `TICKETS.md` |
| Contribution-Workflow | `docs/CONTRIBUTING.md` |
| Coaching-/Trainingslogik | `docs/research/` |

## Completion report

Jede abgeschlossene Aufgabe sollte enthalten: geänderte/erstellte Dateien,
ausgeführte Verifikation (welche Quality Gates liefen, welche fehlten und
warum), bekannte Risiken/offene Punkte, und Follow-ups (z.B. neue ADR nötig,
Spec/Ticket-Update nötig).

## Maintenance

Dieses Dokument aktualisieren, sobald Build-Tooling, Befehle, Teststrategie,
Quality Gates, Konventionen, Boundaries oder Task-Routing sich ändern —
insbesondere sofort nach Abschluss von Epic A1/A2 aus `TICKETS.md`, wenn die
`[NEEDS CONFIRMATION]`-Platzhalter durch echte Befehle ersetzt werden können.
Ziel-Obergrenze: 200 Zeilen.
