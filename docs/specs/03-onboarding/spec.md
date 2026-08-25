# Spec 3: Onboarding — Plan-Erstellung im Chat

**Ziel:** Erster Plan entsteht im geführten Chat-Dialog (wie in diesem
Claude-Chat besprochen), nicht über ein Formular.

**Ablauf:**
1. Chat fragt (falls nicht bekannt): Zieldistanz/-zeit, aktuelle Form (PB oder
   geschätztes Tempo), Zeitrahmen, Trainingstage/Woche verfügbar.
2. Claude generiert einen Plan-Vorschlag (Phasen + erste Wochen konkret,
   spätere Phasen grob) als strukturiertes JSON passend zum Datenmodell aus
   [Spec 2](../02-plan-datenmodell/spec.md).
3. Nutzer bestätigt oder bittet um Anpassung (z.B. anderes Startdatum) —
   iterativ, bis der Plan final ist.
4. Bei Bestätigung: Plan wird in der DB angelegt.

**Design:** Drei Screens im Design-System "Performance Dark" (siehe
[docs/design-system.md](../../design-system.md)):
1. **Start** — kurzer Einstieg vor dem eigentlichen Dialog, ein CTA startet
   den Chat.
2. **Geführter Chat** — Coach fragt Zieldistanz/-zeit, aktuelle Form,
   Zeitrahmen und Trainingstage/Woche ab (Schritt-Anzeige oben rechts);
   Fragen mit klar begrenzten Antwortoptionen (z.B. Trainingstage) bekommen
   zusätzlich Quick-Reply-Chips statt reiner Freitext-Eingabe.
3. **Plan-Vorschlag** — die bisherigen Angaben werden als Zusammenfassung
   über dem Verlauf angezeigt, die generierte Antwort erscheint als
   Chat-Nachricht mit eingebetteter Plan-Karte (Phasenübersicht + Woche 1 im
   Detail) statt als Fließtext-JSON, mit den zwei Aktionen "Plan bestätigen"
   und "Anpassung wünschen" (siehe AC unten).

Visuelle Referenz (Claude-Design-Canvas, privat):
https://claude.ai/code/artifact/a7691a56-03c8-4a38-aa75-86a5aa36c93a

**Chat-UI-Implementierung:** Vercel AI SDK (`useChat` für den Verlauf,
`generateObject`/Tool-Calls für den strukturierten Plan-Vorschlag) — siehe
[ADR-0003](../../decisions/0003-chat-layer-vercel-ai-sdk.md).

**Acceptance Criteria:**
- WHEN der Nutzer im Onboarding-Chat alle nötigen Eckdaten gegeben hat, THE
  SYSTEM SHALL einen vollständigen Plan-Vorschlag als strukturierte Daten
  zurückgeben (nicht nur Fließtext).
- IF Eckdaten fehlen (z.B. kein Zeitrahmen genannt), THEN THE SYSTEM SHALL
  gezielt nachfragen, bevor ein Plan generiert wird.
- WHEN der Nutzer den Vorschlag bestätigt, THE SYSTEM SHALL den Plan
  persistent in der DB speichern.
- WHEN der Nutzer vor Bestätigung eine Änderung wünscht, THE SYSTEM SHALL den
  Vorschlag anpassen, ohne bereits bestätigte Teile zu verwerfen.
