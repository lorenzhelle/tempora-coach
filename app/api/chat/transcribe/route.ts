import { deepgram } from "@ai-sdk/deepgram";
import { transcribe } from "ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  const { text } = await transcribe({
    model: deepgram.transcription("nova-3"),
    audio: new Uint8Array(await audio.arrayBuffer()),
  });

  return NextResponse.json({ text });
}
