# Tempora

Tempora ist eine Webapp für einen strukturierten Lauf-Trainingsplan
(aktuelles Ziel: 5 km unter 20 Minuten). Sie synct Lauf-Aktivitäten über
Strava (siehe [ADR-0002](docs/decisions/0002-datenquelle-strava.md)), hält
den Trainingsplan als strukturiertes Datenmodell statt nur als Text, zeigt
ihn in einem Dashboard, und erlaubt Anpassungen über einen Chat-Layer.

## Who this is for

v1 ist bewusst auf einen einzelnen Nutzer zugeschnitten (siehe "Nicht in
Scope" in [docs/specs/00-fundament/tickets.md](docs/specs/00-fundament/tickets.md)).
Die Strava-OAuth-Architektur ist grundsätzlich multi-user-fähig, falls das
später gewünscht wird.

## Prerequisites and setup

- Voraussetzungen: `[NEEDS CONFIRMATION: Node.js-Version — noch nicht
  festgelegt]`
- Setup: Es existiert noch kein lauffähiger Code — das Projekt-Setup ist
  [docs/specs/00-fundament/tickets.md](docs/specs/00-fundament/tickets.md)
  Ticket A1 ("Projekt-Setup"). Sobald das erledigt ist, diesen Abschnitt
  aktualisieren.
- Agent-Befehle und Quality Gates: siehe [AGENTS.md](AGENTS.md)

## Use

Aktuell gibt es keine lauffähige App — das Repository befindet sich in der
Planungs-/Kontext-Phase. Der aktuelle Stand:

- [CLAUDE.md](CLAUDE.md) — Projektkontext und Produktrahmen
- [docs/specs/](docs/specs/) — Feature-Specs (EARS-Acceptance-Criteria) und
  zugehörige Tickets, je ein Unterordner pro Spec

## Documentation

- Agent-Anweisungen: [AGENTS.md](AGENTS.md)
- Nicht verhandelbare Invarianten: [docs/constitution.md](docs/constitution.md)
- Contribution-Workflow: [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)
- Architektur: [docs/architecture.md](docs/architecture.md)
- Betrieb: [docs/runbooks/runbook.md](docs/runbooks/runbook.md)
- Decision Records: [docs/decisions/README.md](docs/decisions/README.md)
- Fachliche Recherche (Coaching-Logik): [docs/research/](docs/research/)

## Help and support

Persönliches Projekt eines einzelnen Betreibers/Nutzers — kein öffentlicher
Support-Kanal. Fragen/Bugs: direkt im Repo als Issue, sobald GitHub-Issues
aktiviert sind (`[NEEDS CONFIRMATION]`).

## License or usage terms

`[NEEDS CONFIRMATION: keine LICENSE-Datei im Repo — privates Projekt, Lizenz
noch nicht festgelegt]`
