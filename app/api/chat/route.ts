import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import {
  planProposalSchema,
  quickRepliesSchema,
} from "@/lib/coaching/plan-schema";
import { ONBOARDING_SYSTEM_PROMPT } from "@/lib/coaching/system-prompt";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    // Plain provider/model-id string — routed through Vercel AI Gateway,
    // not the @ai-sdk/anthropic provider (see ADR-0006).
    model: "anthropic/claude-sonnet-5",
    system: ONBOARDING_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      suggestQuickReplies: tool({
        description:
          "Offer the user a small set of tappable quick-reply options for a closed question, in addition to prose. The user can still type a free-text answer instead.",
        inputSchema: quickRepliesSchema,
        // These are UI-only tools: chat-view.tsx renders them but never
        // resolves them with a client-side tool result (a quick-reply tap
        // or a typed free-text answer both just send a normal follow-up
        // user message). Without a server-side `execute`, the tool call
        // stays unresolved in history, and convertToModelMessages throws
        // AI_MissingToolResultsError on the next turn. Executing
        // immediately gives every tool call a matching result.
        execute: async () => null,
      }),
      proposePlan: tool({
        description:
          "Propose a structured training plan once training history, goal, and time budget are known.",
        inputSchema: planProposalSchema,
        execute: async () => null,
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
