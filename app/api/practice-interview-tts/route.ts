import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        text?: string;
      }
    | null;

  if (!body || !body.text || !body.text.trim()) {
    return NextResponse.json(
      { success: false, error: "Missing text for TTS" },
      { status: 400 },
    );
  }

  const input = body.text.trim();
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return NextResponse.json(
      { success: false, error: "TTS is not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        voice: "alloy",
        input,
        format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      console.error("OpenAI TTS error", errorPayload);
      return NextResponse.json(
        { success: false, error: "Unable to generate speech audio" },
        { status: 500 },
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Practice interview TTS error", error);
    return NextResponse.json(
      { success: false, error: "There was a problem generating speech audio." },
      { status: 500 },
    );
  }
}
