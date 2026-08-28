# Onboarding — Tickets

Builds on [00-fundament](../00-fundament/tickets.md) and
[02-plan-datenmodell](../02-plan-datenmodell/tickets.md). See
[spec.md](spec.md) for the goal and acceptance criteria.

### C1 — Chat UI scaffold
- The `/onboarding` route (auth-gated — redirect to `/login` if signed
  out): one continuous chat screen, no separate intro screen, using the
  Vercel AI SDK's `useChat` (see
  [ADR-0003](../../decisions/0003-chat-layer-vercel-ai-sdk.md)), still
  without a real Anthropic integration (mock responses); UI per
  [spec.md](spec.md) ("Design") and
  [docs/design-system.md](../../design-system.md)
- A record control for sending a voice memo instead of typing (UI only in
  this ticket — wired to real transcription in C2)
- **Acceptance:** messages are held and displayed via `useChat` state

### C2 — Anthropic integration + onboarding prompt
- An API route under `app/api/chat/` that calls Claude
  (`claude-sonnet-5`) via the Vercel AI SDK (`streamText`,
  `@ai-sdk/anthropic`) with a system prompt (coaching logic + training
  principles, reduced Phase 1/2/4/5 scope per [spec.md](spec.md) "Flow")
- A `proposePlan` tool defined alongside that same `streamText` call
  (not a separate `generateObject` step) with a Zod schema for the
  structured plan proposal (JSON per Spec 2) — the model decides on its
  own when to call it; rendered client-side as the plan card (see
  "Design" in spec.md)
- A separate `app/api/chat/transcribe/` route wrapping `@ai-sdk/deepgram`
  for server-side voice-memo transcription; the transcript is sent as a
  normal chat message
- **Acceptance:** the chat can ask for the target inputs (by text or
  voice) and return a plan proposal as structured data (Spec 3, AC 1+2+
  voice AC)

### C3 — Plan confirmation → DB
- Until this ticket ships, "Confirm plan" only flips local chat state —
  it must not claim to have saved anything (see [spec.md](spec.md)
  "Design")
- On confirmation in chat: the plan proposal is persisted to `Plan`/
  `Milestone`/`TrainingWeek`/`PlannedSession`
- **Acceptance:** after confirmation, the plan is queryable in the DB
  (Spec 3, AC 3)
