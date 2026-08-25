# Constitution

Nicht verhandelbare Invarianten für Tempora. Diese Regeln stehen über
`AGENTS.md`-Konventionen und dürfen nur durch eine neue, ausdrückliche
Entscheidung (ADR in `docs/decisions/`) geändert werden — nie stillschweigend
per Code-Änderung.

## Sicherheit

- **SEC-001** — Strava-Access-/Refresh-Tokens, Anthropic-API-Keys und alle
  anderen Secrets dürfen niemals ins Git-Repository (Code, Config, Logs,
  Commit-Historie) gelangen. Sie leben ausschließlich in `.env` (lokal) bzw.
  in den Secret-Mechanismen der Hosting-Plattform (Vercel Environment
  Variables).
- **SEC-002** — Strava-Access-Tokens laufen nach 6h ab. Der Refresh muss
  automatisch und proaktiv erfolgen (vor Ablauf), nicht reaktiv erst wenn ein
  API-Aufruf fehlschlägt (siehe `docs/specs/01-strava-sync/spec.md` Spec 1, AC 4).
- **SEC-003** — Wird ein Refresh-Token ungültig (Nutzer hat Zugriff in Strava
  widerrufen), MUSS die Verbindung als getrennt markiert werden; der Fehler
  darf keine anderen Syncs blockieren (siehe `docs/specs/01-strava-sync/spec.md` Spec 1, AC 5).

## Datenintegrität

- **DATA-001** — Der Trainingsplan ist ein strukturiertes Datenmodell in der
  DB (`Plan`, `Milestone`, `TrainingWeek`, `PlannedSession`), nicht nur Text
  im Chatverlauf. Mutationen laufen ausschließlich über Next.js API-Routes —
  niemals direkt aus Frontend-Code oder ungeprüft aus einer Chat-Antwort.
- **DATA-002** — Strava-Aktivitäten werden über `stravaActivityId`
  dedupliziert. Ein wiederholter Sync-Lauf oder ein doppeltes Webhook-Event
  darf nie zu doppelten `Activity`-Einträgen führen (siehe
  `docs/specs/01-strava-sync/spec.md` Spec 1, AC 3).
- **DATA-003** — Eine Chat-Anpassung ändert gezielt die betroffenen Felder
  eines Plans, nie den gesamten Plan neu generieren (siehe
  `docs/specs/05-chat-anpassung/spec.md` Spec 5, AC 1). Das verhindert, dass
  bereits bestätigte Planteile unbeabsichtigt überschrieben werden.

## Architekturgrenzen

- **ARCH-001** — Datenquelle für Lauf-Aktivitäten ist Strava (OAuth +
  Webhooks), kein Garmin-Direktsync-Sidecar mehr (siehe
  [ADR-0002](decisions/0002-datenquelle-strava.md)). Ein Wechsel der
  Datenquelle erfordert eine neue ADR, die ADR-0002 explizit ablöst.
- **ARCH-002** — v1 bleibt bewusst auf einen Nutzer beschränkt (kein
  Auth-System für mehrere Accounts). Eine Ausweitung auf Multi-User ist eine
  separate, noch offene Entscheidung (siehe "Nicht in Scope" in
  `docs/specs/00-fundament/tickets.md`) und erfordert eine eigene ADR, bevor
  sie umgesetzt wird.

## Trainingsprinzipien (fachliche Sicherheitsregeln)

- **SAFE-001** — Eine Chat-Anfrage, die einen Einzellauf plant, der stark
  über den längsten Lauf der letzten 30 Tage springt (RUNSAFE-Spike-Regel,
  siehe `docs/research/`), darf nicht still übernommen werden. Das System
  MUSS erst darauf hinweisen, bevor die Änderung angewendet wird (siehe
  `docs/specs/05-chat-anpassung/spec.md` Spec 5, AC 4).
- **SAFE-002** — Punktueller Knochenschmerz (Schienbein/Fuß/Hüfte) folgt
  nicht der normalen Schmerz-Ampel-Logik (0–10-Skala) — er ist immer ein
  Stopp-Signal für Aufprallbelastung, unabhängig vom Zahlenwert (siehe
  `docs/research/progression-und-verletzungspraevention.md`).

## Human vs. agent approval gates

- Menschliche Freigabe erforderlich vor: Merge in den Default-Branch,
  jeder destruktiven Git-Operation (force-push, reset --hard), jeder
  Schema-Migration mit bestehenden Daten, jedem Wechsel der Datenquelle oder
  der Multi-User-Entscheidung (siehe ARCH-001/ARCH-002).
- Ein Coding-Agent darf ohne Rückfrage: Code gemäß den Specs/Tickets unter
  `docs/specs/` implementieren, Tests schreiben/ausführen, Dokumentation
  gemäß diesem Kontext-Layer aktualisieren.

## Governance-Metadaten

- Eigentümer: `[NEEDS CONFIRMATION: formaler Owner — aktuell einziger
  Nutzer/Betreiber des Projekts]`
- Letzte Überprüfung: 2026-08-25
- Änderungsprozess: Eine Invariante wird nur durch eine neue ADR geändert,
  nie durch eine stille Code- oder Doku-Änderung.

## Related documentation

- Agent-Anweisungen: [AGENTS.md](../AGENTS.md)
- Architektur: [docs/architecture.md](architecture.md)
- Entscheidungshistorie: [docs/decisions/README.md](decisions/README.md)

## Maintenance

Überprüfen, wenn sich Sicherheits-, Datenintegritäts- oder
Architekturgrenzen ändern — jede Änderung läuft über eine neue ADR, nie
über eine direkte Bearbeitung bestehender Invarianten-IDs.
