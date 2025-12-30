import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

async function getCurrentUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  return payload.userId;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roleId: string }> },
) {
  const prisma = getPrisma();
  const { roleId } = await context.params;
  const userId = await getCurrentUserId(req);

  if (!userId) {
    return NextResponse.json({ interviews: [] }, { status: 200 });
  }

  // Ensure the role belongs to the current user.
  const role = await prisma.role.findFirst({
    where: { id: roleId, userId },
    select: { id: true },
  });

  if (!role) {
    return NextResponse.json({ interviews: [] }, { status: 200 });
  }

  const interviews = await prisma.roleInterview.findMany({
    where: { roleId },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(
    {
      interviews: interviews.map((i: (typeof interviews)[number]) => ({
        id: i.id,
        interviewerType: i.interviewerType,
        interviewerName: i.interviewerName,
        notes: i.notes,
        scheduledAt: i.scheduledAt ? i.scheduledAt.toISOString() : null,
        createdAt: i.createdAt.toISOString(),
      })),
    },
    { status: 200 },
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ roleId: string }> },
) {
  const prisma = getPrisma();
  const { roleId } = await context.params;
  const userId = await getCurrentUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Ensure the role exists and belongs to the user.
  const role = await prisma.role.findFirst({
    where: { id: roleId, userId },
    select: { id: true },
  });

  if (!role) {
    return NextResponse.json(
      { error: "Role not found" },
      { status: 404 },
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { interviewerType, interviewerName, scheduledAt, notes } =
    (body ?? {}) as {
      interviewerType?: unknown;
      interviewerName?: unknown;
      scheduledAt?: unknown;
      notes?: unknown;
    };

  if (typeof interviewerType !== "string" || !interviewerType.trim()) {
    return NextResponse.json(
      { error: "Interviewer type is required" },
      { status: 400 },
    );
  }

  if (typeof interviewerName !== "string" || !interviewerName.trim()) {
    return NextResponse.json(
      { error: "Interviewer name is required" },
      { status: 400 },
    );
  }

  if (typeof scheduledAt !== "string" || !scheduledAt.trim()) {
    return NextResponse.json(
      { error: "Scheduled date and time are required" },
      { status: 400 },
    );
  }

  const safeType = interviewerType.trim();
  const safeName = interviewerName.trim();
  const safeNotes =
    typeof notes === "string" && notes.trim() !== "" ? notes.trim() : null;

  const parsedDate = new Date(scheduledAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json(
      { error: "scheduledAt must be a valid ISO date-time string" },
      { status: 400 },
    );
  }

  try {
    const interview = await prisma.roleInterview.create({
      data: {
        roleId,
        interviewerType: safeType,
        interviewerName: safeName,
        scheduledAt: parsedDate,
        notes: safeNotes,
      },
    });

    return NextResponse.json(
      {
        success: true,
        interview: {
          id: interview.id,
          interviewerType: interview.interviewerType,
          interviewerName: interview.interviewerName,
          notes: interview.notes,
          scheduledAt: interview.scheduledAt
            ? interview.scheduledAt.toISOString()
            : null,
          createdAt: interview.createdAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unable to create interview";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
