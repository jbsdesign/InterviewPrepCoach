import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Speech input is not available because the OpenAI API key is not configured.",
      },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("audio");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "Missing audio file" },
      { status: 400 },
    );
  }

  try {
    const openaiForm = new FormData();
    openaiForm.set("file", file);
    openaiForm.set("model", "whisper-1");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
        },
        body: openaiForm,
      },
    );

    const data = (await response.json().catch(() => ({}))) as any;

    if (!response.ok || !data?.text) {
      const message = (data as any)?.error?.message;
      const code = (data as any)?.error?.code;

      if (
        code === "insufficient_quota" ||
        (typeof message === "string" &&
          message.toLowerCase().includes("exceeded your current quota"))
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Speech input is temporarily unavailable because the OpenAI account is out of quota. You can still type your answers.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error:
            message ||
            `Unable to transcribe audio (status ${response.status}). Please try again.`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        text: data.text as string,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Speech transcription error", error);
    return NextResponse.json(
      {
        success: false,
        error: "There was a problem transcribing that audio.",
      },
      { status: 500 },
    );
  }
}
