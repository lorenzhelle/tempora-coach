"use client";

import { useRef, useState } from "react";

export function VoiceRecorder({
  onTranscribed,
  disabled,
}: {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        for (const track of stream.getTracks()) track.stop();
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        setTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", blob, "voice-memo.webm");
          const response = await fetch("/api/chat/transcribe", {
            method: "POST",
            body: formData,
          });
          if (!response.ok) throw new Error("transcription failed");
          const { text } = (await response.json()) as { text: string };
          if (text.trim()) onTranscribed(text.trim());
        } catch {
          setError("Transkription fehlgeschlagen — bitte erneut versuchen.");
        } finally {
          setTranscribing(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
    } catch {
      setError("Mikrofonzugriff nicht möglich.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
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
