# ADR-0007: Voice-memo transcription — Vercel AI Gateway instead of a direct Deepgram provider

## Status
Decided — 2026-08-28 (amends [ADR-0006](0006-vercel-ai-gateway.md) — that
ADR moved the chat *language* model to Vercel AI Gateway but explicitly
left transcription on a direct `@ai-sdk/deepgram` provider; this ADR closes
that gap)

## Context
[Ticket C2](../specs/03-onboarding/tickets.md) implemented onboarding
voice-memo transcription (Spec 3, "Voice input") as a separate
`app/api/chat/transcribe/` route wrapping `@ai-sdk/deepgram`
(`deepgram.transcription("nova-3")`), called once with the fully-recorded
audio Blob after the user stops recording. By direction of the project
operator, this moves to Vercel AI Gateway too, for the same reasons as
ADR-0006 (single vendor/vercel-native, pass-through pricing, no
provider-specific package to hold keys for) — specifically using Gateway's
`google/gemini-3.5-transcribe-live` model.

`google/gemini-3.5-transcribe-live` is a **streaming-only** Gateway model:
it's only reachable through the AI SDK's `experimental_streamTranscribe`
over a WebSocket, not the one-shot `transcribe()` function the Deepgram
integration used. Adopting it is therefore not just a model-string swap —
it also changes how audio reaches the model.

Options considered:
1. **Keep `@ai-sdk/deepgram`.** No change, but keeps a second, non-Gateway
   model provider/API key around for no reason other than inertia, now that
   ADR-0006 established the Gateway pattern for the chat model.
2. **Move to a Gateway batch transcription model** (e.g. `openai/whisper-1`
   or `google/gemini-3.5-transcribe`), keeping the existing
   record-then-upload-the-whole-Blob flow and calling the one-shot
   `transcribe()` with a plain Gateway model-id string — the smallest
   possible change, mirroring ADR-0006 exactly.
3. **Move to Gateway's streaming model, `google/gemini-3.5-transcribe-live`.**
   Chosen, per operator direction. Requires the browser to capture raw PCM
   audio (via the Web Audio API) and stream it live over a Gateway
   WebSocket while recording, rather than uploading one finished Blob
   afterward. More moving parts than option 2, but transcription happens
   during recording instead of after it, so the tail-latency after the
   user stops recording is much shorter.

## Decision
Onboarding voice-memo transcription goes through **Vercel AI Gateway**,
using the streaming model **`google/gemini-3.5-transcribe-live`** — not a
direct `@ai-sdk/deepgram` provider connection, and not a Gateway batch
model.

- `app/api/chat/transcribe/route.ts` no longer transcribes anything itself.
  It now only mints a short-lived Gateway client secret
  (`gateway.experimental_transcription.getToken({ model: "google/gemini-3.5-transcribe-live" })`)
  for the browser — minting a client secret is explicitly server-only in
  the AI SDK (it throws if called where `window` exists), so this hop
  can't be removed.
- `app/onboarding/voice-recorder.tsx` uses that secret to build its own
  `createGateway({ apiKey: token })` client-side, captures mic audio as raw
  16-bit PCM via `AudioContext`/`ScriptProcessorNode`, and streams it to
  `experimental_streamTranscribe` for the duration of the recording. No
  audio file is ever uploaded to the app's own server.
- One voice memo still produces exactly one final transcript, auto-sent as a
  normal chat message once recording stops (Spec 3's "no separate
  review/edit step" still holds — there's no separate confirm/edit UI). Per
  operator direction, the streaming transport is also used to show a live,
  continuously-updating preview of the transcript-in-progress while
  recording: `voice-recorder.tsx` drains `result.fullStream` (not just
  `result.text`) and reports the running text via an `onPartialTranscript`
  callback, which `chat-view.tsx` feeds straight into the existing chat text
  input (chosen over a separate preview bubble, to avoid a second UI
  element). The input field (and send button) are disabled while recording
  so the user can't fight the live-filling text with manual typing.
- `@ai-sdk/deepgram` is removed from `package.json`; `@ai-sdk/gateway`
  becomes a **direct** dependency (previously only transitive via `ai`) —
  needed for `createGateway` client-side and
  `gateway.experimental_transcription.getToken` server-side, neither of
  which is covered by the plain-model-id-string shortcut `streamText`/
  `transcribe` use elsewhere.
- `DEEPGRAM_API_KEY` is retired. `AI_GATEWAY_API_KEY` (already required per
  ADR-0006) now also covers transcription — no new env var.

## Consequences
- `package.json`: `@ai-sdk/deepgram` removed, `@ai-sdk/gateway` added as a
  direct dependency.
- `.env.example`, `AGENTS.md`, `docs/specs/03-onboarding/spec.md`,
  `docs/specs/03-onboarding/tickets.md` updated to drop `DEEPGRAM_API_KEY`
  and describe the Gateway/streaming transcription flow instead.
- `docs/decisions/0006-vercel-ai-gateway.md`'s "`@ai-sdk/deepgram`... are
  unaffected" consequence is superseded by this ADR (left as-is there per
  this repo's convention of not rewriting a past decision's text — see
  `docs/decisions/README.md`).
- New failure mode: transcription now depends on a browser WebSocket to
  Vercel AI Gateway staying open for the whole recording, not just a single
  HTTP request at the end — a dropped connection loses whatever hasn't been
  flushed by the model yet. Not mitigated here (no reconnect/resume logic);
  revisit if this proves to be a real reliability problem in practice.
- Confirmed against a real Gateway account: PCM must be 16-bit signed
  little-endian mono, and the Gateway rejects sample rates outside a fixed
  provider-supported list — a plain `new AudioContext()` (device-default
  rate, typically 44100/48000 Hz) fails with "Unsupported inputAudioFormat:
  expected a provider-supported PCM or G.711 format and sample rate". The
  `AudioContext` is now constructed with an explicit `sampleRate: 16000`
  (Gemini's native input rate) instead of relying on the device default.
- `ScriptProcessorNode` (used for PCM capture) is a deprecated Web Audio
  API, kept here because it needs no separate AudioWorklet module file to
  ship; still supported in all evergreen browsers as of this writing.
- Confirmed against a real recording that `transcript-delta`/
  `transcript-partial`/`transcript-final` parts are grouped by segment `id`
  and each **replaces**, rather than appends to, that segment's previous
  guess: a first version that appended everything into one running string
  double-displayed text (a `transcript-delta` glued onto the still-open
  `transcript-partial` guess it was correcting). `voice-recorder.tsx` now
  tracks confirmed/pending text per segment id, closing a segment out
  entirely (discarding its partial/delta history) once its
  `transcript-final` arrives — since a final's text can differ substantially
  from every partial/delta seen for that segment, it's the model's fully
  reconsidered result for it, not an increment. This only affects the live
  preview; `onTranscribed` still fires solely from `result.text`.
- No effect on cost beyond Vercel's own AI Gateway pricing (pass-through,
  per ADR-0006) — not independently verified here.

## Related documentation
- Amends: [ADR-0006](0006-vercel-ai-gateway.md)
- Onboarding spec (voice input): [docs/specs/03-onboarding/spec.md](../specs/03-onboarding/spec.md)
- Ticket C2: [docs/specs/03-onboarding/tickets.md](../specs/03-onboarding/tickets.md)
- Vercel AI Gateway speech-to-text docs: https://vercel.com/docs/ai-gateway/modalities/speech-to-text
