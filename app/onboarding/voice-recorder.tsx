"use client";

import { createGateway } from "@ai-sdk/gateway";
import {
  type StreamTranscriptionResult,
  experimental_streamTranscribe as streamTranscribe,
} from "ai";
import { useRef, useState } from "react";

// google/gemini-3.5-transcribe-live is a streaming-only Gateway model, so
// audio is captured as raw 16-bit PCM and streamed over a WebSocket while
// recording (via experimental_streamTranscribe), instead of uploading one
// finished recording afterward. The live text is surfaced via
// onPartialTranscript as it arrives; onTranscribed still only fires once,
// with the final transcript, when recording stops.
function floatTo16BitPCM(input: Float32Array): Uint8Array {
  const output = new Uint8Array(input.length * 2);
  const view = new DataView(output.buffer);
  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, sample * (sample < 0 ? 0x8000 : 0x7fff), true);
  }
  return output;
}

export function VoiceRecorder({
  onTranscribed,
  onPartialTranscript,
  onRecordingChange,
  onTranscribingChange,
  disabled,
}: {
  onTranscribed: (text: string) => void;
  onPartialTranscript?: (text: string) => void;
  onRecordingChange?: (recording: boolean) => void;
  onTranscribingChange?: (transcribing: boolean) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const controllerRef =
    useRef<ReadableStreamDefaultController<Uint8Array> | null>(null);
  const resultRef = useRef<StreamTranscriptionResult | null>(null);
  const failedRef = useRef(false);
  // Bumped on every start/failure so a stale consumeTranscript() loop from a
  // previous (stopped or failed) recording can tell it's no longer current
  // and stop calling onPartialTranscript.
  const sessionIdRef = useRef(0);

  // Consumes the live transcript stream for onPartialTranscript. Must start
  // before anything awaits `result.text` (fullStream is single-consumer) —
  // stopRecording's `await result?.text` below relies on this loop having
  // already drained fullStream by the time the model finalizes.
  //
  // Confirmed against a real recording: parts are grouped per segment `id`,
  // and each type means something different than "append text" —
  // - transcript-partial: the model's current in-flight guess for that
  //   segment, REPLACING the previous guess (it revises, not just extends).
  // - transcript-delta: confirms a chunk of that segment's text — it
  //   supersedes (not appends to) the in-flight guess it was derived from.
  // - transcript-final: the model's fully-reconsidered text for that whole
  //   segment, which can differ substantially from every partial/delta seen
  //   for it — it REPLACES that segment's contribution entirely, not just
  //   appends onto a running total.
  // A global running string for all of this (as a first version did) double-
  // displays text: e.g. appending a delta onto a still-open partial guess
  // glues two different guesses for the same words together.
  const consumeTranscript = async (
    result: StreamTranscriptionResult,
    sessionId: number,
  ) => {
    const order: string[] = [];
    const confirmed = new Map<string, string>(); // delta-confirmed text per segment id
    const pending = new Map<string, string>(); // in-flight partial per segment id
    const finalText = new Map<string, string>(); // segment ids closed out by a final

    const render = () =>
      order
        .map((id) =>
          finalText.has(id)
            ? finalText.get(id)
            : `${confirmed.get(id) ?? ""} ${pending.get(id) ?? ""}`.trim(),
        )
        .filter(Boolean)
        .join(" ");

    try {
      for await (const part of result.fullStream) {
        if (sessionIdRef.current !== sessionId) return;
        if (
          part.type !== "transcript-delta" &&
          part.type !== "transcript-partial" &&
          part.type !== "transcript-final"
        ) {
          continue;
        }
        const id = part.id ?? "default";
        if (!order.includes(id)) order.push(id);

        if (part.type === "transcript-delta") {
          const prev = confirmed.get(id);
          confirmed.set(id, prev ? `${prev} ${part.delta}` : part.delta);
          pending.delete(id);
        } else if (part.type === "transcript-partial") {
          pending.set(id, part.text);
        } else {
          finalText.set(id, part.text);
          confirmed.delete(id);
          pending.delete(id);
        }
        onPartialTranscript?.(render());
      }
    } catch {
      // Connection failures are surfaced via handleStreamFailure()/
      // result.text's own rejection instead — nothing to do here.
    }
  };

  const cleanupAudio = () => {
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    for (const track of mediaStreamRef.current?.getTracks() ?? []) track.stop();
    mediaStreamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
  };

  // The Gateway connection can drop mid-recording (WebSocket closed,
  // transcription model unavailable, …) — the mic keeps producing audio
  // regardless, so without this the ReadableStream just throws on every
  // subsequent enqueue() forever. Idempotent: both the enqueue failure and
  // the stream's own cancel() can trigger it.
  const handleStreamFailure = () => {
    if (failedRef.current) return;
    failedRef.current = true;
    sessionIdRef.current++;
    if (processorRef.current) processorRef.current.onaudioprocess = null;
    controllerRef.current = null;
    resultRef.current = null;
    setError("Transkription fehlgeschlagen — bitte erneut versuchen.");
    setRecording(false);
    onRecordingChange?.(false);
    setTranscribing(false);
    onTranscribingChange?.(false);
    cleanupAudio();
  };

  const startRecording = async () => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Mikrofonzugriff nicht möglich.");
      return;
    }
    mediaStreamRef.current = stream;

    try {
      const tokenResponse = await fetch("/api/chat/transcribe", {
        method: "POST",
      });
      if (!tokenResponse.ok) throw new Error("token request failed");
      const { token } = (await tokenResponse.json()) as { token: string };
      const gateway = createGateway({ apiKey: token });

      // Gemini's native input rate — and one of the fixed PCM rates the
      // Gateway's transcription endpoint accepts. Browsers default a plain
      // `new AudioContext()` to the device's native rate (typically 44100
      // or 48000 Hz), which the Gateway rejects with "Unsupported
      // inputAudioFormat", so request 16kHz explicitly instead of reading
      // back whatever the hardware happens to use.
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      // Zero-gain node: keeps the (deprecated but universally supported)
      // ScriptProcessorNode firing by routing it to the destination, without
      // echoing the mic audibly back to the user.
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      source.connect(processor);
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);

      failedRef.current = false;
      const micStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controllerRef.current = controller;
          processor.onaudioprocess = (event) => {
            try {
              controller.enqueue(
                floatTo16BitPCM(event.inputBuffer.getChannelData(0)),
              );
            } catch {
              handleStreamFailure();
            }
          };
        },
        cancel() {
          handleStreamFailure();
        },
      });

      const result = streamTranscribe({
        model: gateway.transcriptionModel("google/gemini-3.5-transcribe-live"),
        audio: micStream,
        inputAudioFormat: { type: "audio/pcm", rate: audioContext.sampleRate },
      });
      resultRef.current = result;
      const sessionId = ++sessionIdRef.current;
      void consumeTranscript(result, sessionId);

      setRecording(true);
      onRecordingChange?.(true);
    } catch {
      setError("Transkription fehlgeschlagen — bitte erneut versuchen.");
      cleanupAudio();
    }
  };

  const stopRecording = async () => {
    setRecording(false);
    onRecordingChange?.(false);
    setTranscribing(true);
    onTranscribingChange?.(true);
    try {
      controllerRef.current?.close();
      controllerRef.current = null;
      cleanupAudio();
      const result = resultRef.current;
      resultRef.current = null;
      const text = await result?.text;
      if (text?.trim()) onTranscribed(text.trim());
    } catch {
      setError("Transkription fehlgeschlagen — bitte erneut versuchen.");
    } finally {
      setTranscribing(false);
      onTranscribingChange?.(false);
    }
  };

  return (
    <div className="relative flex items-center">
      {error && (
        <span className="absolute bottom-[46px] left-0 w-max max-w-[220px] rounded-chip border border-border bg-surface px-2.5 py-1.5 text-xs text-warn">
          {error}
        </span>
      )}
      <button
        type="button"
        className={`h-10 w-10 shrink-0 cursor-pointer rounded-control border bg-surface-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
          recording ? "border-warn text-warn" : "border-border text-text"
        }`}
        onClick={recording ? stopRecording : startRecording}
        disabled={disabled || transcribing}
        aria-label={recording ? "Aufnahme stoppen" : "Sprachmemo aufnehmen"}
      >
        {transcribing ? "…" : recording ? "■" : "●"}
      </button>
    </div>
  );
}
