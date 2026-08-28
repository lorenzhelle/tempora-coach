"use client";

import { useChat } from "@ai-sdk/react";
import { type FormEvent, useRef, useState } from "react";
import type {
  PlanProposal,
  QuickReplies as QuickRepliesType,
} from "@/lib/coaching/plan-schema";
import { PlanCard } from "./plan-card";
import { QuickReplies } from "./quick-replies";
import { VoiceRecorder } from "./voice-recorder";

export function OnboardingChat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isBusy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    if (!text.trim() || isBusy) return;
    sendMessage({ text: text.trim() });
    setInput("");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <main className="mx-auto flex h-dvh max-w-[720px] flex-col">
      <header className="flex h-[72px] shrink-0 items-center border-b border-border px-5">
        <span className="font-heading font-bold tracking-[0.04em]">
          TEMPORA
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <p className="max-w-[80%] self-start rounded-[4px_16px_16px_16px] bg-surface px-4 py-3 text-[15px] leading-normal whitespace-pre-wrap">
            Hey! Lass uns deinen Trainingsplan aufsetzen — erzähl mir kurz, was
            dein Laufziel ist, oder schick mir eine Sprachmemo.
          </p>
        )}

        {messages.map((message) =>
          message.parts.map((part, index) => {
            const key = `${message.id}-${index}`;

            if (part.type === "text" && part.text) {
              return (
                <p
                  key={key}
                  className={`max-w-[80%] px-4 py-3 text-[15px] leading-normal whitespace-pre-wrap ${
                    message.role === "user"
                      ? "self-end rounded-[16px_4px_16px_16px] bg-accent-soft"
                      : "self-start rounded-[4px_16px_16px_16px] bg-surface"
                  }`}
                >
                  {part.text}
                </p>
              );
            }

            if (
              part.type === "tool-suggestQuickReplies" &&
              part.state === "input-available"
            ) {
              const { options } = part.input as QuickRepliesType;
              return (
                <QuickReplies
                  key={key}
                  options={options}
                  onSelect={send}
                  disabled={isBusy}
                />
              );
            }

            if (
              part.type === "tool-proposePlan" &&
              part.state === "input-available"
            ) {
              return (
                <PlanCard
                  key={key}
                  plan={part.input as PlanProposal}
                  onRequestChange={focusInput}
                />
              );
            }

            return null;
          }),
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-2.5 border-t border-border px-5 py-4"
      >
        <VoiceRecorder onTranscribed={send} disabled={isBusy} />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Schreib deine Antwort…"
          disabled={isBusy}
          className="flex-1 rounded-control border border-border bg-surface-2 px-3.5 py-2.5 text-[15px] focus:-outline-offset-1 focus:outline-[1.5px] focus:outline-accent"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-control bg-accent px-4 py-2.5 font-heading font-semibold text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isBusy || !input.trim()}
        >
          Senden
        </button>
      </form>
    </main>
  );
}
