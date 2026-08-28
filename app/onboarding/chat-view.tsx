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
    <main className="onboarding">
      <header className="onboarding-header">
        <span className="wordmark">TEMPORA</span>
      </header>

      <div className="chat-history">
        {messages.length === 0 && (
          <p className="chat-bubble chat-bubble-coach">
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
                  className={`chat-bubble ${
                    message.role === "user"
                      ? "chat-bubble-user"
                      : "chat-bubble-coach"
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

      <form onSubmit={handleSubmit} className="chat-input-row">
        <VoiceRecorder onTranscribed={send} disabled={isBusy} />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Schreib deine Antwort…"
          disabled={isBusy}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={isBusy || !input.trim()}
        >
          Senden
        </button>
      </form>
    </main>
  );
}
