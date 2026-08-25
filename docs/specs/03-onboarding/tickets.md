# Onboarding — Tickets

Setzt auf [00-fundament](../00-fundament/tickets.md) und
[02-plan-datenmodell](../02-plan-datenmodell/tickets.md) auf. Siehe
[spec.md](spec.md) für Ziel und Acceptance Criteria.

### C1 — Chat-UI-Grundgerüst
- Chat-Komponente (Nachrichtenverlauf + Input) mit Vercel AI SDKs `useChat`
  (siehe [ADR-0003](../../decisions/0003-chat-layer-vercel-ai-sdk.md)),
  noch ohne echte Anthropic-Anbindung (Mock-Responses); UI gemäß den
  Screens in [spec.md](spec.md) ("Design") und
  [docs/design-system.md](../../design-system.md)
- **Akzeptanz:** Nachrichten werden über `useChat`-State gehalten und
  angezeigt

### C2 — Anthropic-Anbindung + Onboarding-Prompt
- API Route unter `app/api/chat/`, die per Vercel AI SDK (`streamText`,
  `@ai-sdk/anthropic`) Claude mit System-Prompt (Coaching-Logik +
  Trainingsprinzipien) aufruft
- Tool-Definition/`generateObject` mit Zod-Schema für strukturierten
  Plan-Vorschlag (JSON gemäß Spec 2), gerendert als Plan-Karte (siehe
  "Design" in spec.md)
- **Akzeptanz:** Chat kann Zieldaten erfragen und einen Plan-Vorschlag als
  strukturierte Daten zurückgeben (Spec 3, AC 1+2)

### C3 — Plan-Bestätigung → DB
- Bei Bestätigung im Chat: Plan-Vorschlag wird in `Plan`/`Milestone`/
  `TrainingWeek`/`PlannedSession` persistiert
- **Akzeptanz:** Nach Bestätigung ist der Plan in der DB abfragbar (Spec 3,
  AC 3)
