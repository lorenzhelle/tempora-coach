import {
  evaluateIntake,
  generatePlan,
  intakeProfileSchema,
  partialIntakeProfileSchema,
} from "@tempora/plan-engine";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { mapGeneratedPlanToProposal } from "@/lib/coaching/plan-mapper";
import { quickRepliesSchema } from "@/lib/coaching/plan-schema";
import { buildOnboardingSystemPrompt } from "@/lib/coaching/system-prompt";
import { createClient } from "@/lib/supabase/server";

const generatePlanInputSchema = intakeProfileSchema.extend({
  startDate: z
    .string()
    .optional()
    .describe(
      "ISO 8601 date the plan should start on; defaults to today if omitted",
    ),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await request.json();

  // The engine is pure and never reads the clock (see ADR-0009) — "today"
  // is computed once here, in app code, and threaded into both the
  // system prompt (so the model can resolve relative dates) and every
  // tool call below.
  const today = new Date().toISOString().slice(0, 10);

  const result = streamText({
    // Plain provider/model-id string — routed through Vercel AI Gateway,
    // not the @ai-sdk/anthropic provider (see ADR-0006).
    model: "anthropic/claude-sonnet-5",
    system: buildOnboardingSystemPrompt(today),
    messages: await convertToModelMessages(messages),
    // updateIntake and generatePlan do real work whose result the model
    // needs to see before it can respond (what's still missing; the
    // generated plan itself) — allow up to 5 model<->tool round trips per
    // request so that can happen within a single turn.
    stopWhen: stepCountIs(5),
    tools: {
      suggestQuickReplies: tool({
        description:
          "Offer the user a small set of tappable quick-reply options for a closed question, in addition to prose. The user can still type a free-text answer instead.",
        inputSchema: quickRepliesSchema,
        // UI-only: chat-view.tsx renders this from the tool call's input,
        // never its (unused) output. Without a server-side `execute`,
        // the tool call stays unresolved in history and
        // convertToModelMessages throws AI_MissingToolResultsError on
        // the next turn — executing immediately just gives every tool
        // call a matching result.
        execute: async () => null,
      }),
      updateIntake: tool({
        description:
          "Record the intake fields gathered so far and check whether enough is known to generate a plan. Call with the FULL set of fields gathered in the conversation so far, not just fields from the latest message — each call is evaluated independently, with no memory of previous calls.",
        inputSchema: partialIntakeProfileSchema,
        execute: async (input) => evaluateIntake(input, today),
      }),
      generatePlan: tool({
        description:
          "Deterministically compute the full training plan (fitness index, training paces, feasibility, phase placement, weekly volume, and every day-by-day session for the whole horizon) from the complete gathered intake profile. Call this once updateIntake reports canGenerate: true — never invent plan numbers yourself.",
        inputSchema: generatePlanInputSchema,
        execute: async ({ startDate, ...intake }) => {
          const result = generatePlan({
            ...intake,
            startDate: startDate ?? today,
            today,
          });
          return mapGeneratedPlanToProposal(result);
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
