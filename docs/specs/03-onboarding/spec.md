# Spec 3: Onboarding — Plan Creation in Chat

**Goal:** The first plan is created in a guided chat dialog (as discussed
in this Claude chat), not via a form.

**Flow:**
1. The chat asks (if not already known), by text or by voice memo: a
   brief safety screening (PAR-Q+ style, see
   `docs/research/onboarding-und-trainingsmethodik.md` Part 2 Phase 1),
   current training history, target distance/time, a target date or
   timeframe (capped at 12 months out — see AC below), training days/week
   available plus a preferred long-run day, schedule regularity
   (predictable vs. irregular/shift work), gym/strength access, and age/
   height/weight. Injury history is a conditional follow-up (only probed
   on a "yes" during safety screening); resting heart rate and sleep/
   stress (Phase 6 in the research doc) stay deferred past v1 — pace-based
   zone derivation from a PB (research doc Part 1E) doesn't need them. Age/
   height/weight, unlike resting HR, *are* asked — not for zone
   derivation, but for injury-risk stratification (see
   [ADR-0008](../../decisions/0008-full-horizon-deterministic-plan-generation.md));
   this data is collected but not yet wired into any rule.
2. Once enough of the above is known, a deterministic progression
   algorithm computes the full plan for the whole horizon — every week's
   phase, volume, and day-by-day sessions, capped at 12 months (see
   ADR-0008) — and Claude proposes it as structured JSON matching the
   data model from [Spec 2](../02-plan-datenmodell/spec.md), writing only
   the free-text phase/session prose within that already-fixed structure.
   The model decides on its own when it has enough to propose, no
   separate "generate" step the user has to trigger.
3. The user confirms or asks for an adjustment (e.g. a different start
   date) — iteratively, until the plan is final. A requested adjustment
   during onboarding may trigger a full replan of the still-unconfirmed
   draft directly, without an extra confirm step (ADR-0008) — "Confirm
   plan" remains the one gate before persistence.
4. On confirmation: the plan is created in the DB — tracked as
   [issue C3](https://github.com/lorenzhelle/tempora-coach/issues/11) in
   milestone `03-onboarding` (chat UI scaffold and Claude integration,
   formerly tickets C1/C2, are done).

**Design:** One continuous chat screen (`/onboarding`, auth-gated — signed-
out visitors are redirected to `/login`) in the "Performance Dark" design
system (see [docs/design-system.md](../../design-system.md)), no separate
intro/start screen and no step wizard:
- The coach asks for the Flow-1 inputs above conversationally; questions
  with clearly bounded answer options (e.g. training days) additionally
  get quick-reply chips instead of pure free-text input.
- **Voice input:** next to the text input, a record control lets the user
  send a voice memo instead of typing. Audio is streamed live to a
  transcription model via Vercel AI Gateway while recording (see
  [ADR-0007](../../decisions/0007-vercel-ai-gateway-transcription.md)),
  filling the text input live as words are recognized; once recording
  stops, that transcript is sent as a normal chat message — no separate
  review/edit step.
- **Plan proposal:** once Claude has enough to propose, its response
  appears as a chat message with an embedded plan card — a phase overview
  plus the full week-by-week plan (every week at full day-by-day detail,
  per ADR-0008), navigable via a week switcher rather than showing only
  week 1 — instead of prose JSON, with the two actions "Confirm plan" and
  "Request a change" (see AC below). Confirming only updates local chat
  state for now (ticket C3 adds the actual DB write) — it never claims to
  have saved something it hasn't.
- **Explaining workouts:** the plan card renders each session's
  LLM-authored `description` (specific to that instance, e.g. a
  bodyweight-only strength routine when there's no gym access) plus a
  small static, always-accurate one-line-per-type legend — the six
  session types never change, so this doesn't need to be LLM-generated.
  The coach also gives one brief paragraph in chat naming/explaining the
  session types present, once, when first proposing the plan — kept
  short, not repeated on later turns. The pain-traffic-light model and
  its bone-pain exception are **not** explained to the user in this pass
  (ADR-0008 "Deferred") — the plan is simply more conservative when they
  apply, without saying why yet.

Visual reference (Claude Design canvas, private):
https://claude.ai/code/artifact/a7691a56-03c8-4a38-aa75-86a5aa36c93a

**Chat UI implementation:** Vercel AI SDK — `useChat` for the message
history, a `proposePlan` tool (Zod schema matching Spec 2) defined
alongside `streamText` in the same `app/api/chat/` route, not a separate
`generateObject` step — see
[ADR-0003](../../decisions/0003-chat-layer-vercel-ai-sdk.md). Voice memos
are streamed client-side to the `google/gemini-3.5-transcribe-live` model
via Vercel AI Gateway (`experimental_streamTranscribe`, see
[ADR-0007](../../decisions/0007-vercel-ai-gateway-transcription.md)); a
separate `app/api/chat/transcribe/` route only mints the short-lived
Gateway client secret the browser needs to open that connection.

**Acceptance Criteria:**
- WHEN the user has given all the required inputs in the onboarding chat,
  THE SYSTEM SHALL return a complete plan proposal as structured data
  (not just prose), covering the full horizon at full day-by-day detail —
  not only the first week.
- IF required inputs are missing (e.g. no timeframe given), THEN THE
  SYSTEM SHALL ask targeted follow-up questions before generating a plan.
- IF the user's target date is more than 12 months after the start date,
  THEN THE SYSTEM SHALL ask the user to choose a nearer target instead of
  proposing a plan beyond that horizon (ADR-0008).
- WHEN the user sends a voice memo, THE SYSTEM SHALL transcribe it (client-side,
  streamed to Vercel AI Gateway per ADR-0007) and treat the final transcript
  exactly like a typed chat message.
- WHEN the user confirms the proposal, THE SYSTEM SHALL persist the plan
  to the DB (ticket C3).
- WHEN the user requests a change before confirming, THE SYSTEM SHALL
  adjust the proposal without discarding already-confirmed parts.
