import { gateway } from "@ai-sdk/gateway";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Mints a short-lived Gateway client secret for the browser to open its own
// streaming-transcription WebSocket with (see voice-recorder.tsx). No audio
// passes through this server — google/gemini-3.5-transcribe-live is a
// streaming-only model, so transcription happens client-side via
// experimental_streamTranscribe, not a server-side transcribe() call.
export async function POST() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, url } = await gateway.experimental_transcription.getToken({
    model: "google/gemini-3.5-transcribe-live",
    expiresAfterSeconds: 300, // max — headroom before the client opens the socket
  });

  return NextResponse.json({ token, url });
}
