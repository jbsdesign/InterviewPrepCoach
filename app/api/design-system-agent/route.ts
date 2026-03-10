import { NextResponse } from "next/server";

type ClientMessage = {
  role: "user" | "agent";
  text: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as {
    messages: ClientMessage[];
  };

  const { messages } = body;

  if (!messages || !messages.length) {
    return NextResponse.json(
      { success: false, error: "No messages were provided." },
      { status: 400 },
    );
  }

  const ollamaMessages = [
    {
      role: "system",
      content:
        "You are the Interview Prep Coach design system agent. " +
        "Answer in at most 2 short sentences or 3 very short bullet points. " +
        "When helpful, point to specific sections in the design library by name, such as 'Buttons and actions', 'Inputs and selectors', 'Motion and animation', 'Typography', 'Colors', 'Architecture', 'Accessibility', or 'User workflows'. " +
        "Do not repeat yourself or explain general concepts at length; be direct and specific. " +
        "If you are not sure, say so and suggest the closest relevant section.",
    },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    })),
  ];

  try {
    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3",
        messages: ollamaMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          error: `Local LLM error: ${response.status} ${text}`,
        },
        { status: 500 },
      );
    }

    const data = (await response.json()) as {
      message?: { role?: string; content?: string };
    };

    const reply =
      data.message?.content?.trim() ||
      "The design system agent did not return a reply.";

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reach the local Ollama server. Is it running?",
      },
      { status: 500 },
    );
  }
}
