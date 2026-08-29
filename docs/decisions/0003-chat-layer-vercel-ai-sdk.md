# ADR-0003: Chat layer implementation — Vercel AI SDK

## Status
Decided — 2026-08-25 (amended by [ADR-0006](0006-vercel-ai-gateway.md)
2026-08-28 — the model-provider connection below, `@ai-sdk/anthropic`, is
replaced by Vercel AI Gateway; the choice of the Vercel AI SDK itself, and
of Claude as the model, are unaffected and still governed by this ADR)

## Context
The chat layer (onboarding dialog, [Spec 3](../specs/03-onboarding/spec.md);
chat-based plan adjustment, [Spec 5](../specs/05-chat-anpassung/spec.md))
runs as a Next.js API route and calls the Anthropic API (see
`docs/architecture.md`). This integration needs to handle three things:

1. Pass streamed responses from the model through to the chat UI without
   building custom streaming boilerplate (SSE/readable-stream handling)
   from scratch.
2. Enforce structured output for the plan proposal (onboarding AC 1:
   "return a complete plan proposal as structured data, not just prose")
   and for targeted plan updates (Spec 5, DATA-003) — both need to fit the
   data model from [Spec 2](../specs/02-plan-datenmodell/spec.md).
3. Manage message state on the client (chat history, loading state, tool
   results) without a lot of custom reducer code.

Options:

1. **A raw Anthropic SDK integration** (`@anthropic-ai/sdk` directly).
   Full control, but streaming parsing, tool-use response handling, and
   client-side message-state management would all have to be built from
   scratch.
2. **Vercel AI SDK** (the `ai` package + the `@ai-sdk/anthropic`
   provider). Built exactly for this Next.js+LLM setup: `streamText`/
   `generateObject` server-side, `useChat`/`useObject` hooks on the
   client, native tool calling that maps directly onto a Zod schema for
   the plan JSON from Spec 2.

## Decision
The chat layer is built with the **Vercel AI SDK**.

- `@ai-sdk/anthropic` remains the model provider — **no** change to the
  existing choice of Anthropic/Claude as the LLM, only to the
  client/server integration. **Superseded by
  [ADR-0006](0006-vercel-ai-gateway.md):** the model provider is now
  Vercel AI Gateway (a plain `"anthropic/claude-sonnet-5"` model-id
  string, no `@ai-sdk/anthropic` package) — still Claude, still called
  through the same `streamText`/`useChat` integration described below.
- API routes under `app/api/chat/` use `streamText` (free-form chat
  responses) or `generateObject`/tool definitions with a Zod schema
  (structured plan proposal, targeted plan updates).
- The chat UI uses `useChat` for message history and streaming; where a
  structured response is expected (the plan proposal), the result is
  rendered from the tool-call/`generateObject` result instead of being
  parsed out of prose.

## Consequences
- New dependencies: `ai` (added to `package.json` with Epic A1/A2);
  `@ai-sdk/anthropic` was also added here but has since been removed
  again per [ADR-0006](0006-vercel-ai-gateway.md).
- [Ticket C1/C2](../specs/03-onboarding/tickets.md) (chat UI scaffold,
  Anthropic integration) are built directly against `useChat`/
  `streamText`, not against a homegrown streaming solution.
- [Ticket E1–E3](../specs/05-chat-anpassung/tickets.md) (plan context,
  targeted updates, training-principles check) build on the same AI SDK
  integration as C2 — no second chat stack for Spec 5.
- Structured-output validation runs via Zod schemas that must match the
  plan data model (Spec 2) — schema changes there may require updates to
  the AI SDK tool definitions.
- No effect on cost or model choice — only on how the integration is
  implemented.

## Related documentation
- Amended by: [ADR-0006](0006-vercel-ai-gateway.md) (model-provider
  connection: Vercel AI Gateway instead of `@ai-sdk/anthropic`)
- Architecture: [docs/architecture.md](../architecture.md)
- Onboarding design (screens that show this chat UI):
  [docs/specs/03-onboarding/spec.md](../specs/03-onboarding/spec.md)
- Design system: [docs/design-system.md](../design-system.md)
