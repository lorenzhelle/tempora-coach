# ADR-0006: Model provider connection — Vercel AI Gateway instead of a direct Anthropic provider

## Status
Decided — 2026-08-28 (amends [ADR-0003](0003-chat-layer-vercel-ai-sdk.md) —
the Vercel AI SDK as the chat-layer integration still stands; only how it
reaches the model changes; amended by [ADR-0007](0007-vercel-ai-gateway-transcription.md)
2026-08-28 — the transcription consequence below, "`@ai-sdk/deepgram`...
unaffected," no longer holds: transcription moves to Gateway too)

## Context
[ADR-0003](0003-chat-layer-vercel-ai-sdk.md) settled the chat layer on the
Vercel AI SDK (`ai` package) calling Claude through the dedicated
`@ai-sdk/anthropic` provider package, authenticated with a directly-held
`ANTHROPIC_API_KEY`. By direction of the project operator, this direct
provider connection is replaced with
[Vercel AI Gateway](https://vercel.com/docs/ai-gateway): a single Vercel
endpoint in front of hundreds of models (including Anthropic's), reached
through the same AI SDK calls with no separate client object.

Options considered:

1. **Keep the direct `@ai-sdk/anthropic` provider.** Simplest, no new
   moving part, but couples the code to one vendor's package and requires
   holding + rotating a raw Anthropic API key ourselves.
2. **Vercel AI Gateway.** The AI SDK's `streamText`/`generateText`/etc.
   already accept a plain `"provider/model-id"` string (e.g.
   `"anthropic/claude-sonnet-5"`) and route it through the Gateway
   automatically — no `@ai-sdk/anthropic` (or any other per-provider)
   package needed. Since the app already deploys on Vercel (ADR-0004's
   Postgres-on-Vercel-adjacent hosting, `docs/runbooks/runbook.md`'s
   deploy pipeline), this adds no new vendor, only a new Vercel product.
   Pass-through pricing, no token markup vs. calling Anthropic directly.
   Trade-off: request auth now depends on Vercel's Gateway being up, one
   more hop between the app and Anthropic.

## Decision
The chat layer's model calls go through **Vercel AI Gateway**, not a
direct `@ai-sdk/anthropic` provider connection.

- `app/api/chat/route.ts` passes the model as a plain string,
  `"anthropic/claude-sonnet-5"`, to `streamText` — no provider package
  import. Switching models (a different Anthropic model, or a different
  provider entirely) is now a one-line string change, not a dependency
  change.
- `@ai-sdk/anthropic` is removed from `package.json` — nothing in the app
  imports it anymore.
- **Auth:**
  - Local dev/CI: `AI_GATEWAY_API_KEY` (a Vercel AI Gateway API key,
    created in the Vercel dashboard's AI Gateway → API Keys page) in
    `.env`. The AI SDK reads this env var automatically — no code needed
    to pass it explicitly.
  - Deployed on Vercel (Preview/Production, per the pipeline in
    `docs/runbooks/runbook.md`): no key needed at all. Vercel
    auto-provides an OIDC token (`VERCEL_OIDC_TOKEN`) that the Gateway
    accepts, so nothing has to be stored as a Vercel environment variable
    for this specifically.
  - `ANTHROPIC_API_KEY` is retired — no code or env file references it
    anymore.
- The underlying LLM is unchanged: still Claude (`claude-sonnet-5`, per
  ADR-0003) — this ADR only changes the transport/auth path to it, not
  the model choice or the AI-SDK-based integration pattern.

## Consequences
- `package.json`: `@ai-sdk/anthropic` dependency removed
  (`@ai-sdk/react`, `@ai-sdk/deepgram`, and `ai` itself are unaffected —
  only the Anthropic-specific provider package goes).
- `.env.example`, `AGENTS.md`, `README.md`, `docs/runbooks/runbook.md`,
  and `docs/specs/00-fundament/tickets.md` are updated to reference
  `AI_GATEWAY_API_KEY` instead of `ANTHROPIC_API_KEY`.
- `docs/architecture.md`'s "System context" and module-map entries for
  the chat layer are updated to name Vercel AI Gateway instead of a
  direct Anthropic API dependency.
- [Ticket C2](../specs/03-onboarding/tickets.md) (Anthropic
  integration) is implemented against the Gateway's plain-string model
  id, not `@ai-sdk/anthropic` — its ticket text is updated to match.
- No effect on cost beyond Vercel's own AI Gateway pricing (stated as
  zero-markup pass-through on tokens) — not independently verified here,
  left to the operator to monitor via the Gateway's usage dashboard.
- No effect on prompt content, tool definitions, or the Zod schemas from
  Spec 2/Spec 3 — this is purely a transport/auth change.
- New failure mode to be aware of: if Vercel AI Gateway has an outage or
  the Gateway API key is misconfigured, the chat layer fails even though
  Anthropic's API itself is healthy — a dependency ADR-0003 didn't carry
  when calling Anthropic directly. Not mitigated in this ADR (no fallback
  provider configured); revisit if this proves to be a real reliability
  problem in practice.

## Related documentation
- Supersedes/amends: [ADR-0003](0003-chat-layer-vercel-ai-sdk.md)
- Amended by: [ADR-0007](0007-vercel-ai-gateway-transcription.md) (voice-memo
  transcription also moves to Gateway)
- Architecture: [docs/architecture.md](../architecture.md)
- Deployment pipeline (why the app is already Vercel-hosted):
  [docs/runbooks/runbook.md](../runbooks/runbook.md)
- Vercel AI Gateway docs: https://vercel.com/docs/ai-gateway
