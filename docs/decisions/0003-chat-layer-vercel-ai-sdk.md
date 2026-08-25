# ADR-0003: Chat-Layer-Implementierung — Vercel AI SDK

## Status
Entschieden — 2026-08-25

## Kontext
Der Chat-Layer (Onboarding-Dialog, [Spec 3](../specs/03-onboarding/spec.md);
Chat-basierte Plan-Anpassung, [Spec 5](../specs/05-chat-anpassung/spec.md))
läuft als Next.js API-Route und ruft die Anthropic API auf (siehe
`docs/architecture.md`). Drei Dinge muss diese Anbindung leisten:

1. Gestreamte Antworten vom Modell an die Chat-UI durchreichen, ohne
   Custom-Streaming-Boilerplate (SSE/Readable-Stream-Handling) selbst zu
   bauen.
2. Strukturierte Ausgabe erzwingen für den Plan-Vorschlag (Onboarding AC 1:
   "vollständigen Plan-Vorschlag als strukturierte Daten zurückgeben, nicht
   nur Fließtext") und für gezielte Plan-Updates (Spec 5, DATA-003) — beides
   muss zum Datenmodell aus [Spec 2](../specs/02-plan-datenmodell/spec.md)
   passen.
3. Message-State im Client (Chat-Verlauf, Ladezustand, Tool-Ergebnisse) ohne
   viel eigenen Reducer-Code verwalten.

Optionen:

1. **Rohe Anthropic-SDK-Anbindung** (`@anthropic-ai/sdk` direkt). Volle
   Kontrolle, aber Streaming-Parsing, Tool-Use-Response-Handling und
   Client-seitiges Message-State-Management müssten selbst gebaut werden.
2. **Vercel AI SDK** (`ai`-Package + `@ai-sdk/anthropic`-Provider). Genau für
   dieses Next.js+LLM-Setup gebaut: `streamText`/`generateObject`
   serverseitig, `useChat`/`useObject`-Hooks für den Client, natives
   Tool-Calling, das sich direkt mit einem Zod-Schema für das Plan-JSON aus
   Spec 2 verbinden lässt.

## Entscheidung
Der Chat-Layer wird mit dem **Vercel AI SDK** gebaut.

- `@ai-sdk/anthropic` bleibt der Modell-Provider — **keine** Änderung an der
  bestehenden Wahl von Anthropic/Claude als LLM, nur an der
  Client/Server-Anbindung.
- API-Routes unter `app/api/chat/` nutzen `streamText` (freies
  Chat-Antworten) bzw. `generateObject`/Tool-Definitionen mit Zod-Schema
  (strukturierter Plan-Vorschlag, gezielte Plan-Updates).
- Die Chat-UI nutzt `useChat` für Nachrichtenverlauf und Streaming; wo eine
  strukturierte Antwort erwartet wird (Plan-Vorschlag), wird das Ergebnis
  aus dem Tool-Call/`generateObject`-Result gerendert statt geparst aus
  Freitext.

## Konsequenzen
- Neue Dependencies: `ai`, `@ai-sdk/anthropic` (werden mit Epic A1/A2 in
  `package.json` aufgenommen).
- [Ticket C1/C2](../specs/03-onboarding/tickets.md) (Chat-UI-Grundgerüst,
  Anthropic-Anbindung) werden direkt gegen `useChat`/`streamText` gebaut,
  nicht gegen eine selbstgebaute Streaming-Lösung.
- [Ticket E1–E3](../specs/05-chat-anpassung/tickets.md) (Plan-Kontext,
  gezielte Updates, Trainingsprinzipien-Check) bauen auf derselben
  AI-SDK-Anbindung auf wie C2 — kein zweiter Chat-Stack für Spec 5.
- Structured-Output-Validierung läuft über Zod-Schemas, die zum
  Plan-Datenmodell (Spec 2) passen müssen — Schema-Änderungen dort ziehen
  ggf. Anpassungen der AI-SDK-Tool-Definitionen nach sich.
- Kein Einfluss auf Kosten oder Modellwahl — nur auf die Implementierung der
  Anbindung.

## Related documentation
- Architektur: [docs/architecture.md](../architecture.md)
- Onboarding-Design (Screens, die diese Chat-UI zeigen):
  [docs/specs/03-onboarding/spec.md](../specs/03-onboarding/spec.md)
- Design-System: [docs/design-system.md](../design-system.md)
