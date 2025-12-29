import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

async function getCurrentUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  return payload.userId;
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);

  if (!userId) {
    return NextResponse.json({ interviews: [] }, { status: 200 });
  }

  const now = new Date();

  const interviews = await prisma.roleInterview.findMany({
    where: {
      role: { userId },
      scheduledAt: { not: null, gte: now },
    },
    include: {
      role: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json(
    {
      interviews: interviews.map((iv) => ({
        id: iv.id,
        roleId: iv.roleId,
        roleTitle: iv.role.title,
        company: iv.role.company,
        interviewerType: iv.interviewerType,
        interviewerName: iv.interviewerName,
        scheduledAt: iv.scheduledAt ? iv.scheduledAt.toISOString() : null,
        notes: iv.notes,
      })),
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { roleId, interviewerType, interviewerName, scheduledAt, notes } =
    (body ?? {}) as {
      roleId?: unknown;
      interviewerType?: unknown;
      interviewerName?: unknown;
      scheduledAt?: unknown;
      notes?: unknown;
    };

  if (typeof roleId !== "string" || !roleId.trim()) {
    return NextResponse.json(
      { error: "roleId is required" },
      { status: 400 },
    );
  }

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

  const safeRoleId = roleId.trim();
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

  // Ensure the role exists and belongs to the current user.
  const role = await prisma.role.findFirst({
    where: { id: safeRoleId, userId },
    select: { id: true },
  });

  if (!role) {
    return NextResponse.json(
      { error: "Role not found" },
      { status: 404 },
    );
  }

  try {
    const interview = await prisma.roleInterview.create({
      data: {
        roleId: safeRoleId,
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

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { interviewId, interviewerType, notes, scheduledAt } = (body ?? {}) as {
    interviewId?: unknown;
    interviewerType?: unknown;
    notes?: unknown;
    scheduledAt?: unknown;
  };

  if (typeof interviewId !== "string" || !interviewId.trim()) {
    return NextResponse.json(
      { error: "interviewId is required" },
      { status: 400 },
    );
  }

  const safeInterviewId = interviewId.trim();
  let safeType: string | undefined;
  if (typeof interviewerType === "string" && interviewerType.trim() !== "") {
    safeType = interviewerType.trim();
  }
  const safeNotes =
    typeof notes === "string" && notes.trim() !== "" ? notes.trim() : null;

  let safeScheduledAt: Date | undefined;
  if (typeof scheduledAt === "string" && scheduledAt.trim() !== "") {
    const parsed = new Date(scheduledAt);
    if (!Number.isNaN(parsed.getTime())) {
      safeScheduledAt = parsed;
    }
  }

  // Ensure the interview belongs to a role owned by the current user.
  const existing = await prisma.roleInterview.findFirst({
    where: { id: safeInterviewId, role: { userId } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Interview not found" },
      { status: 404 },
    );
  }

  try {
    const interview = await prisma.roleInterview.update({
      where: { id: safeInterviewId },
      data: {
        ...(safeType ? { interviewerType: safeType } : {}),
        ...(safeScheduledAt ? { scheduledAt: safeScheduledAt } : {}),
        notes: safeNotes,
      },
    });

    return NextResponse.json(
      {
        success: true,
        interview: {
          id: interview.id,
          interviewerType: interview.interviewerType,
          notes: interview.notes,
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
        : "Unable to update interview";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { interviewId } = (body ?? {}) as { interviewId?: unknown };

  if (typeof interviewId !== "string" || !interviewId.trim()) {
    return NextResponse.json(
      { error: "interviewId is required" },
      { status: 400 },
    );
  }

  const safeInterviewId = interviewId.trim();

  // Ensure the interview belongs to a role owned by the current user.
  const existing = await prisma.roleInterview.findFirst({
    where: { id: safeInterviewId, role: { userId } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Interview not found" },
      { status: 404 },
    );
  }

  try {
    await prisma.roleInterview.delete({ where: { id: safeInterviewId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unable to delete interview";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
