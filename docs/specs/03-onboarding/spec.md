# Spec 3: Onboarding — Plan Creation in Chat

**Goal:** The first plan is created in a guided chat dialog (as discussed
in this Claude chat), not via a form.

**Flow:**
1. The chat asks (if not already known): target distance/time, current
   fitness (PB or estimated pace), timeframe, training days/week
   available.
2. Claude generates a plan proposal (phases + the first weeks in detail,
   later phases roughly sketched) as structured JSON matching the data
   model from [Spec 2](../02-plan-datenmodell/spec.md).
3. The user confirms or asks for an adjustment (e.g. a different start
   date) — iteratively, until the plan is final.
4. On confirmation: the plan is created in the DB.

**Design:** Three screens in the "Performance Dark" design system (see
[docs/design-system.md](../../design-system.md)):
1. **Start** — a brief intro before the actual dialog, one CTA starts the
   chat.
2. **Guided chat** — the coach asks for target distance/time, current
   fitness, timeframe, and training days/week (a step indicator top
   right); questions with clearly bounded answer options (e.g. training
   days) additionally get quick-reply chips instead of pure free-text
   input.
3. **Plan proposal** — the answers so far are shown as a summary above
   the history, the generated response appears as a chat message with an
   embedded plan card (phase overview + week 1 in detail) instead of
   prose JSON, with the two actions "Confirm plan" and "Request a change"
   (see AC below).

Visual reference (Claude Design canvas, private):
https://claude.ai/code/artifact/a7691a56-03c8-4a38-aa75-86a5aa36c93a

**Chat UI implementation:** Vercel AI SDK (`useChat` for the history,
`generateObject`/tool calls for the structured plan proposal) — see
[ADR-0003](../../decisions/0003-chat-layer-vercel-ai-sdk.md).

**Acceptance Criteria:**
- WHEN the user has given all the required inputs in the onboarding chat,
  THE SYSTEM SHALL return a complete plan proposal as structured data
  (not just prose).
- IF required inputs are missing (e.g. no timeframe given), THEN THE
  SYSTEM SHALL ask targeted follow-up questions before generating a plan.
- WHEN the user confirms the proposal, THE SYSTEM SHALL persist the plan
  to the DB.
- WHEN the user requests a change before confirming, THE SYSTEM SHALL
  adjust the proposal without discarding already-confirmed parts.
