# Onboarding — Tickets

Builds on [00-fundament](../00-fundament/tickets.md) and
[02-plan-datenmodell](../02-plan-datenmodell/tickets.md). See
[spec.md](spec.md) for the goal and acceptance criteria.

### C1 — Chat UI scaffold
- Chat component (message history + input) using the Vercel AI SDK's
  `useChat` (see
  [ADR-0003](../../decisions/0003-chat-layer-vercel-ai-sdk.md)), still
  without a real Anthropic integration (mock responses); UI per the
  screens in [spec.md](spec.md) ("Design") and
  [docs/design-system.md](../../design-system.md)
- **Acceptance:** messages are held and displayed via `useChat` state

### C2 — Anthropic integration + onboarding prompt
- An API route under `app/api/chat/` that calls Claude via the Vercel AI
  SDK (`streamText`, `@ai-sdk/anthropic`) with a system prompt (coaching
  logic + training principles)
- Tool definition/`generateObject` with a Zod schema for the structured
  plan proposal (JSON per Spec 2), rendered as a plan card (see "Design"
  in spec.md)
- **Acceptance:** the chat can ask for the target inputs and return a
  plan proposal as structured data (Spec 3, AC 1+2)

### C3 — Plan confirmation → DB
- On confirmation in chat: the plan proposal is persisted to `Plan`/
  `Milestone`/`TrainingWeek`/`PlannedSession`
- **Acceptance:** after confirmation, the plan is queryable in the DB
  (Spec 3, AC 3)
