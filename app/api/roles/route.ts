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
    return NextResponse.json({ roles: [] }, { status: 200 });
  }

  const roles = await prisma.role.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    {
      roles: roles.map((role: (typeof roles)[number]) => ({
        id: role.id,
        title: role.title,
        company: role.company,
        level: role.level,
        description: role.description,
        status: role.status,
        createdAt: role.createdAt.toISOString(),
        updatedAt: role.updatedAt.toISOString(),
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

  const { title, company, level, description } = (body ?? {}) as {
    title?: unknown;
    company?: unknown;
    level?: unknown;
    description?: unknown;
  };

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "Role title is required" },
      { status: 400 },
    );
  }

  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json(
      { error: "Role description is required" },
      { status: 400 },
    );
  }

  const safeTitle = title.trim();
  const safeCompany =
    typeof company === "string" && company.trim() !== ""
      ? company.trim()
      : null;
  const safeLevel =
    typeof level === "string" && level.trim() !== ""
      ? level.trim()
      : null;
  const safeDescription = description.trim();

  try {
    const role = await prisma.role.create({
      data: {
        userId,
        title: safeTitle,
        company: safeCompany,
        level: safeLevel,
        description: safeDescription,
      },
    });

    return NextResponse.json(
      {
        success: true,
        role: {
          id: role.id,
          title: role.title,
          company: role.company,
          level: role.level,
          description: role.description,
          status: role.status,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString(),
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
        : "Unable to create role";

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

  const { roleId, title, company, level, description } = (body ?? {}) as {
    roleId?: unknown;
    title?: unknown;
    company?: unknown;
    level?: unknown;
    description?: unknown;
  };

  if (typeof roleId !== "string" || !roleId.trim()) {
    return NextResponse.json(
      { error: "roleId is required" },
      { status: 400 },
    );
  }

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "Role title is required" },
      { status: 400 },
    );
  }

  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json(
      { error: "Role description is required" },
      { status: 400 },
    );
  }

  const safeRoleId = roleId.trim();
  const safeTitle = title.trim();
  const safeCompany =
    typeof company === "string" && company.trim() !== ""
      ? company.trim()
      : null;
  const safeLevel =
    typeof level === "string" && level.trim() !== ""
      ? level.trim()
      : null;
  const safeDescription = description.trim();

  // Ensure the role belongs to the current user.
  const existing = await prisma.role.findFirst({
    where: { id: safeRoleId, userId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Role not found" },
      { status: 404 },
    );
  }

  try {
    const role = await prisma.role.update({
      where: { id: safeRoleId },
      data: {
        title: safeTitle,
        company: safeCompany,
        level: safeLevel,
        description: safeDescription,
      },
    });

    return NextResponse.json(
      {
        success: true,
        role: {
          id: role.id,
          title: role.title,
          company: role.company,
          level: role.level,
          description: role.description,
          status: role.status,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString(),
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
        : "Unable to update role";

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

  const { roleId } = (body ?? {}) as { roleId?: unknown };

  if (typeof roleId !== "string" || !roleId.trim()) {
    return NextResponse.json(
      { error: "roleId is required" },
      { status: 400 },
    );
  }

  const safeRoleId = roleId.trim();

  // Ensure the role belongs to the current user.
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
    // Delete interviews first, then the role itself.
    await prisma.roleInterview.deleteMany({ where: { roleId: safeRoleId } });
    await prisma.role.delete({ where: { id: safeRoleId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unable to delete role";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
