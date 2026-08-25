# Contributing

Tempora ist aktuell ein persönliches Projekt eines einzelnen
Betreibers/Nutzers — kein offenes Projekt mit externen Contributors. Dieser
Workflow beschreibt, wie der Betreiber selbst (bzw. ein für ihn arbeitender
Coding-Agent) am Repository arbeitet.

## Branching

- Feature-/Ticket-Branches ausgehend vom Default-Branch, benannt nach dem
  bearbeiteten Ticket/Thema (z.B. `claude/laufcoach-strava-agent-70s1cq`).
- `[NEEDS CONFIRMATION: verbindliche Branch-Namenskonvention für zukünftige
  Branches — bisher nur ad hoc]`

## Commits

- Ein Commit pro inhaltlich abgeschlossenem Schritt, nicht pro Datei.
- Commit-Message beschreibt das "Warum", nicht nur das "Was" (siehe
  Commit-Historie in `git log` als Vorbild).

## Pull Requests

- `[NEEDS CONFIRMATION: formaler PR-Prozess noch nicht etabliert — bisher
  direkte Commits auf Feature-Branches ohne Review durch Dritte, da
  Einzelnutzer-Projekt]`
- Sobald ein PR erstellt wird: Beschreibung fasst die Änderung und den Bezug
  zur betroffenen Spec/den betroffenen Tickets unter `docs/specs/` zusammen.

## Review

- `[NEEDS CONFIRMATION: kein zweiter menschlicher Reviewer vorhanden
  (Einzelnutzer-Projekt) — Review erfolgt aktuell durch den Betreiber selbst
  bzw. durch einen Coding-Agenten gemäß AGENTS.md]`

## Issues

- `[NEEDS CONFIRMATION: GitHub Issues noch nicht als Tracking-Mechanismus
  aktiviert — aktuell laufen offene Aufgaben über docs/specs/*/tickets.md]`
- Neue Aufgaben, die in keiner `docs/specs/*/tickets.md` stehen, dort als
  neues Ticket im passenden Spec-Ordner ergänzen (bzw. in
  `docs/specs/00-fundament/tickets.md`, falls kein Spec-Bezug besteht),
  statt sie nur im Chat zu besprechen.

## Security reporting

- `[NEEDS CONFIRMATION: kein öffentlicher Security-Reporting-Kanal — bei
  einem Einzelnutzer-Projekt direkt den Betreiber kontaktieren]`
- Ein gefundenes Secret-Leak (siehe `docs/constitution.md` SEC-001) sofort
  rotieren (Strava-App neu autorisieren, API-Key neu generieren), bevor der
  Commit gepusht/gemerged wird.

## Help

- Fragen zum Projektkontext: `CLAUDE.md`
- Fragen zur Architektur: `docs/architecture.md`
- Fragen zu Entscheidungen: `docs/decisions/README.md`

## Related documentation

- Agent-Anweisungen und exakte Befehle: [AGENTS.md](../AGENTS.md)
- Invarianten und Freigabe-Grenzen: [docs/constitution.md](constitution.md)

## Maintenance

Aktualisieren, sobald sich Branch-, Commit-, PR-, Review-, Issue- oder
Security-Reporting-Workflow ändert — insbesondere, sobald ein formaler
PR-Prozess oder weitere Contributors hinzukommen.
