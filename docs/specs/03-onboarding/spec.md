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
