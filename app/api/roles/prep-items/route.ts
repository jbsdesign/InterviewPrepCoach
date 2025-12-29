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

  const { roleId, title, details, status } = (body ?? {}) as {
    roleId?: unknown;
    title?: unknown;
    details?: unknown;
    status?: unknown;
  };

  if (typeof roleId !== "string" || !roleId.trim()) {
    return NextResponse.json(
      { error: "roleId is required" },
      { status: 400 },
    );
  }

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 },
    );
  }

  const safeRoleId = roleId.trim();
  const safeTitle = title.trim();
  const safeDetails =
    typeof details === "string" && details.trim() !== ""
      ? details.trim()
      : null;
  const safeStatus =
    typeof status === "string" && status.trim() !== ""
      ? status.trim()
      : "not_started";

  const role = await prisma.role.findFirst({
    where: { id: safeRoleId, userId },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  try {
    const item = await prisma.rolePrepItem.create({
      data: {
        roleId: role.id,
        title: safeTitle,
        details: safeDetails,
        status: safeStatus,
      },
    });

    return NextResponse.json(
      {
        success: true,
        prepItem: {
          id: item.id,
          title: item.title,
          details: item.details,
          status: item.status,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to create prep item" },
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

  const { prepItemId, title, details, status } = (body ?? {}) as {
    prepItemId?: unknown;
    title?: unknown;
    details?: unknown;
    status?: unknown;
  };

  if (typeof prepItemId !== "string" || !prepItemId.trim()) {
    return NextResponse.json(
      { error: "prepItemId is required" },
      { status: 400 },
    );
  }

  const safePrepItemId = prepItemId.trim();

  const existing = await prisma.rolePrepItem.findFirst({
    where: { id: safePrepItemId, role: { userId } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Prep item not found" },
      { status: 404 },
    );
  }

  const updateData: { title?: string; details?: string | null; status?: string } =
    {};

  if (typeof title === "string") {
    const trimmed = title.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 },
      );
    }
    updateData.title = trimmed;
  }

  if (typeof details === "string") {
    const trimmed = details.trim();
    updateData.details = trimmed === "" ? null : trimmed;
  }

  if (typeof status === "string") {
    const trimmed = status.trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: "Status cannot be empty" },
        { status: 400 },
      );
    }
    updateData.status = trimmed;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 },
    );
  }

  try {
    const item = await prisma.rolePrepItem.update({
      where: { id: safePrepItemId },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        prepItem: {
          id: item.id,
          title: item.title,
          details: item.details,
          status: item.status,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to update prep item" },
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

  const { prepItemId } = (body ?? {}) as {
    prepItemId?: unknown;
  };

  if (typeof prepItemId !== "string" || !prepItemId.trim()) {
    return NextResponse.json(
      { error: "prepItemId is required" },
      { status: 400 },
    );
  }

  const safePrepItemId = prepItemId.trim();

  const existing = await prisma.rolePrepItem.findFirst({
    where: { id: safePrepItemId, role: { userId } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Prep item not found" },
      { status: 404 },
    );
  }

  try {
    await prisma.rolePrepItem.delete({ where: { id: safePrepItemId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete prep item" },
      { status: 500 },
    );
  }
}
