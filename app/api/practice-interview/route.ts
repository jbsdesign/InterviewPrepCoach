import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

type HistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: NextRequest) {
  // Look up the current user's profile so the interviewer can be aware of
  // their background, resume, and any extra context they have shared.
  const prisma = getPrisma();

  let profile: {
    fullName: string;
    headline: string | null;
    currentRole: string | null;
    company: string | null;
    yearsExperience: number | null;
    location: string | null;
    summary: string | null;
    extraContext: string | null;
  } | null = null;

  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const payload = verifySessionToken(token);
      if (payload) {
        const dbProfile = await prisma.userProfile.findUnique({
          where: { userId: payload.userId },
        });
        if (dbProfile) {
          profile = {
            fullName: dbProfile.fullName,
            headline: dbProfile.headline,
            currentRole: dbProfile.currentRole,
            company: dbProfile.company,
            yearsExperience: dbProfile.yearsExperience,
            location: dbProfile.location,
            summary: dbProfile.summary,
            extraContext: dbProfile.extraContext,
          };
        }
      }
    }
  } catch (error) {
    console.error("Error loading user profile for practice interview", error);
  }

  const body = (await request.json().catch(() => null)) as
    | {
        roleId?: string;
        roleTitle?: string;
        company?: string | null;
        message?: string;
        history?: HistoryItem[];
      }
    | null;

  if (!body) {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { roleTitle, company, message, history = [] } = body;

  const safeMessage = message?.trim() ?? "";

  // Build a concise candidate profile snippet from stored profile data.
  let candidateProfile =
    "Not available. Start by asking a quick question about their background and goals.";

  if (profile) {
    const lines: string[] = [];
    lines.push(`Name: ${profile.fullName}`);
    if (profile.currentRole) {
      lines.push(
        `Current role: ${profile.currentRole}` +
          (profile.company ? ` at ${profile.company}` : ""),
      );
    } else if (profile.company) {
      lines.push(`Company: ${profile.company}`);
    }
    if (profile.yearsExperience != null) {
      lines.push(`Years of experience: ${profile.yearsExperience}`);
    }
    if (profile.location) {
      lines.push(`Location: ${profile.location}`);
    }
    if (profile.headline) {
      lines.push(`Headline: ${profile.headline}`);
    }
    if (profile.summary) {
      lines.push(`Summary: ${profile.summary}`);
    }
    if (profile.extraContext) {
      const trimmed = profile.extraContext.slice(0, 1400);
      lines.push(
        `Additional context (from resume or supporting docs): ${trimmed}`,
      );
    }
    candidateProfile = lines.join("\n");
  }

  const systemPrompt = `You are a friendly, structured interviewer running a complete mock session for one candidate.

Your job is to guide the candidate through a realistic interview that has a clear beginning, middle, and end.

Follow this structure:
1. Start with a short greeting and one warm up question about their background and interest in the role.
2. Ask 2 or 3 questions about their past experience that relate to the role.
3. Ask 2 or 3 role specific or skills questions.
4. Ask 1 or 2 behavioral or situational questions.
5. Finish with 1 reflection or closing question, then thank them and say the interview is complete.

Rules for each turn:
- Ask exactly one question at a time.
- Keep questions short and clear.
- Briefly acknowledge the candidate's last answer in one or two natural sentences before you ask the next question.
- React naturally to the candidate's tone. If they make a light joke, it is okay to briefly laugh or acknowledge the humor (for example, "Haha, I like that.") before continuing.
- If the candidate does not really answer the question, seems confused, or says they do not know, stay on the same topic: gently rephrase, ask for a concrete example, or narrow the question instead of moving on.
- When the candidate gives a rich answer, pick one specific detail from what they said and ask a short follow up question about that before you move on.
- If the candidate goes off topic, acknowledge what they said briefly, then steer them back to something relevant for the role.
- If the candidate directly asks you for feedback during the interview, give a brief high level comment, then continue the interview.
- Keep each of your responses brief (about 2 to 4 sentences) and avoid bullet lists or headings so it feels like spoken conversation.
- Do not mention that you are an AI language model; act like a human interviewer.
- Keep your overall interview to about 6 to 8 questions unless the candidate clearly wants more.

When you decide the interview is complete, your final reply must have two parts:
1) A short closing in 1 to 2 sentences that feels like a human interviewer thanking them and ending the session.
2) Then a clearly separated written coaching summary using this exact structure:

Feedback summary:
- 1 sentence that sums up how the candidate came across overall.

Strengths:
- 2 to 4 short bullets that highlight specific strengths, referencing concrete examples they shared and any patterns from their background or resume.

Focus areas:
- 2 to 4 short bullets on where they can improve, phrased constructively and tied to what came up in this practice interview.

Next steps to prepare:
- 3 to 5 concrete actions they can take before a real interview, such as practice prompts, topics to review, or stories to refine.

Use what you know from the candidate profile, their background, and the conversation when you describe strengths, focus areas, and next steps.
Keep the entire feedback block under about 220 words so it can be saved and shown in an "AI tips" card without feeling overwhelming.
In that final reply, explain that you will save these notes so they can review them later from their Roles page in the upcoming interviews list for this role.
At the very end of that final reply, append the exact token [[INTERVIEW_COMPLETE]] so the app can detect that the interview has finished. Do not say this token out loud; just include it in the text.

Role title: ${roleTitle || "Unknown"}
Company: ${company || "Unknown"}

Candidate profile (information you already know before the interview starts):
${candidateProfile}`;

  const openaiKey = process.env.OPENAI_API_KEY;

  function buildAcknowledgment(answer: string, turnIndex: number): string {
    const trimmed = answer.trim();
    const generic = [
      "Thanks for walking me through that.",
      "I appreciate that context.",
      "That gives me a good sense of your experience.",
      "That is helpful background.",
    ];

    if (!trimmed) return generic[turnIndex % generic.length];

    const lower = trimmed.toLowerCase();

    if (
      lower.includes("team") ||
      lower.includes("collaborat") ||
      lower.includes("stakeholder")
    ) {
      const options = [
        "It sounds like collaboration and working with others have been important in your work.",
        "It seems like you have had to navigate a lot of teamwork and stakeholder communication.",
      ];
      return options[turnIndex % options.length];
    }

    if (
      lower.includes("deadline") ||
      lower.includes("launch") ||
      lower.includes("ship") ||
      lower.includes("deliverable") ||
      lower.includes("timeline")
    ) {
      const options = [
        "It sounds like you have been close to important launches and delivery timelines.",
        "It seems like owning deadlines and outcomes has been a big part of your work.",
      ];
      return options[turnIndex % options.length];
    }

    if (
      lower.includes("learn") ||
      lower.includes("learning") ||
      lower.includes("new skill") ||
      lower.includes("picked up")
    ) {
      const options = [
        "It sounds like you put real effort into learning and picking up new skills.",
        "It seems like continuous learning has been a theme in your experience.",
      ];
      return options[turnIndex % options.length];
    }

    if (
      lower.includes("conflict") ||
      lower.includes("difficult") ||
      lower.includes("challenge")
    ) {
      const options = [
        "It sounds like you have had to work through some challenging situations.",
        "It seems like you have real experience handling difficult situations professionally.",
      ];
      return options[turnIndex % options.length];
    }

    return generic[turnIndex % generic.length];
  }

  function buildScriptedReply(): string {
    const roleName = roleTitle || "this role";
    const companySuffix = company ? ` at ${company}` : "";

    const scriptedQuestions: string[] = [
      `To start us off, can you give me a brief overview of your background and what interests you about ${roleName}${companySuffix}?`,
      `Looking back over your recent experience, which role or project has best prepared you for ${roleName}, and why?`,
      `Thinking about ${roleName}, what is one accomplishment you are most proud of that you would highlight for this opportunity?`,
      `Can you describe a time you had to learn a new skill quickly in order to succeed in your work? What did you do and what was the outcome?`,
      `Tell me about a challenging situation with a teammate or stakeholder. How did you handle it and what did you learn?`,
      `Imagine you are starting in ${roleName}${companySuffix}. What would you focus on in your first 60 to 90 days?`,
    ];

    const lowerMessage = safeMessage.toLowerCase();
    const isKickoff = lowerMessage.includes("start a new practice interview now");

    const assistantTurns = history.filter((item) => item.role === "assistant").length;

    // The first static greeting from the UI counts as one assistant turn in history.
    // Stage roughly tracks which scripted question we are on.
    const scriptedStage = Math.max(0, assistantTurns - 1);

    if (isKickoff || assistantTurns <= 1 || !safeMessage) {
      // Beginning of the interview.
      return `Great, let us get started. ${scriptedQuestions[0]}`;
    }

    if (scriptedStage >= scriptedQuestions.length) {
      // Wrap up once we have asked all scripted questions.
      return "Thanks for walking through those questions with me. That concludes this practice interview for now. If you would like to keep practicing, you can start a new interview when you are ready.";
    }

    const question = scriptedQuestions[scriptedStage];
    const ack = buildAcknowledgment(safeMessage, assistantTurns);
    return `${ack} ${question}`;
  }

  // Fallback when there is no OpenAI key configured.
  // Run a simple scripted interview so the experience still feels complete.
  if (!openaiKey) {
    const reply = buildScriptedReply();
    return NextResponse.json({ success: true, reply });
  }

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-8).map((item) => ({
        role: item.role,
        content: item.content,
      })),
    ] as { role: "system" | "user" | "assistant"; content: string }[];

    if (safeMessage) {
      messages.push({ role: "user", content: safeMessage });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.6,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as any;

    if (!response.ok || !data?.choices?.[0]?.message?.content) {
      console.error("OpenAI error", data);
      const apiErrorMessage = (data as any)?.error?.message;
      const apiErrorCode = (data as any)?.error?.code;

      // If we have hit a quota limit, gracefully fall back to the scripted
      // interview flow instead of failing the entire request.
      if (
        apiErrorCode === "insufficient_quota" ||
        (typeof apiErrorMessage === "string" &&
          apiErrorMessage.toLowerCase().includes("exceeded your current quota"))
      ) {
        const reply = buildScriptedReply();
        return NextResponse.json({ success: true, reply });
      }

      return NextResponse.json(
        {
          success: false,
          error:
            apiErrorMessage ||
            `The interview agent was unable to respond (status ${response.status}). Please check your OpenAI API key and try again.`,
        },
        { status: 500 },
      );
    }

    const reply: string = data.choices[0].message.content;

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error("Practice interview agent error", error);
    return NextResponse.json(
      {
        success: false,
        error: "There was a problem talking to the interview agent.",
      },
      { status: 500 },
    );
  }
}
