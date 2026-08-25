# Decision Records

Kurze ADRs (Architecture Decision Records) für Entscheidungen, die den
Kontext-Layer (`CLAUDE.md`, `docs/specs/`) bindend festlegen.
Jede Entscheidung hier ist verbindlich für den aktuellen Stand — Widersprüche
zwischen den Kontext-Dateien und einer ADR sind ein Bug im Kontext-Layer und
sollten gefixt werden, sobald sie auffallen.

Format: Status, Kontext, Entscheidung, Konsequenzen. Eine neue Entscheidung,
die eine alte revidiert, bekommt eine neue Nummer und markiert die alte als
"Abgelöst durch ADR-XXXX" statt sie zu löschen.

- [ADR-0001](0001-app-name-tempora.md) — App-Name: Tempora
- [ADR-0002](0002-datenquelle-strava.md) — Datenquelle: Strava statt
  Garmin-Direktsync
- [ADR-0003](0003-chat-layer-vercel-ai-sdk.md) — Chat-Layer-Implementierung:
  Vercel AI SDK
