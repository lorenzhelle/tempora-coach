# Spec 3: Onboarding — Plan Creation in Chat

**Goal:** The first plan is created in a guided chat dialog (as discussed
in this Claude chat), not via a form.

**Flow:**
1. The chat asks (if not already known), by text or by voice memo: a
   brief safety screening (PAR-Q+ style, see
   `docs/research/onboarding-und-trainingsmethodik.md` Part 2 Phase 1),
   current training history, target distance/time, timeframe, and
   training days/week available. Injury history is a conditional
   follow-up (only probed on a "yes" during safety screening); age/
   resting-HR/lifestyle baseline data (Phase 6 in the research doc) is
   deferred past v1 — pace-based zone derivation from a PB (research doc
   Part 1E) doesn't need it.
2. Once enough of the above is known, Claude proposes a plan (phases +
   the first weeks in detail, later phases roughly sketched) as
   structured JSON matching the data model from
   [Spec 2](../02-plan-datenmodell/spec.md) — the model decides on its
   own when it has enough to propose, no separate "generate" step the
   user has to trigger.
3. The user confirms or asks for an adjustment (e.g. a different start
   date) — iteratively, until the plan is final.
4. On confirmation: the plan is created in the DB (ticket C3 — ships
   after the chat/agent integration in tickets C1/C2, see
   [tickets.md](tickets.md)).

**Design:** One continuous chat screen (`/onboarding`, auth-gated — signed-
out visitors are redirected to `/login`) in the "Performance Dark" design
system (see [docs/design-system.md](../../design-system.md)), no separate
intro/start screen and no step wizard:
- The coach asks for the Flow-1 inputs above conversationally; questions
  with clearly bounded answer options (e.g. training days) additionally
  get quick-reply chips instead of pure free-text input.
- **Voice input:** next to the text input, a record control lets the user
  send a voice memo instead of typing. The recording is uploaded and
  transcribed server-side (Deepgram); the transcript is then sent as a
  normal chat message — no separate review/edit step.
- **Plan proposal:** once Claude has enough to propose, its response
  appears as a chat message with an embedded plan card (phase overview +
  week 1 in detail) instead of prose JSON, with the two actions "Confirm
  plan" and "Request a change" (see AC below). Confirming only updates
  local chat state for now (ticket C3 adds the actual DB write) — it
  never claims to have saved something it hasn't.

Visual reference (Claude Design canvas, private):
https://claude.ai/code/artifact/a7691a56-03c8-4a38-aa75-86a5aa36c93a

**Chat UI implementation:** Vercel AI SDK — `useChat` for the message
history, a `proposePlan` tool (Zod schema matching Spec 2) defined
alongside `streamText` in the same `app/api/chat/` route, not a separate
`generateObject` step — see
[ADR-0003](../../decisions/0003-chat-layer-vercel-ai-sdk.md). Voice memos
go through a separate `app/api/chat/transcribe/` route wrapping
`@ai-sdk/deepgram`.

**Acceptance Criteria:**
- WHEN the user has given all the required inputs in the onboarding chat,
  THE SYSTEM SHALL return a complete plan proposal as structured data
  (not just prose).
- IF required inputs are missing (e.g. no timeframe given), THEN THE
  SYSTEM SHALL ask targeted follow-up questions before generating a plan.
- WHEN the user sends a voice memo, THE SYSTEM SHALL transcribe it
  server-side and treat the transcript exactly like a typed chat message.
- WHEN the user confirms the proposal, THE SYSTEM SHALL persist the plan
  to the DB (ticket C3).
- WHEN the user requests a change before confirming, THE SYSTEM SHALL
  adjust the proposal without discarding already-confirmed parts.
