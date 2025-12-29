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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ roleId: string }> },
) {
  const { roleId } = await context.params;
  const userId = await getCurrentUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!roleId) {
    return NextResponse.json(
      { error: "Role identifier is required" },
      { status: 400 },
    );
  }

  const role = await prisma.role.findFirst({
    where: { id: roleId, userId },
  });

  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  const items = await prisma.rolePrepItem.findMany({
    where: { roleId: role.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    {
      prepItems: items.map((item: (typeof items)[number]) => ({
        id: item.id,
        title: item.title,
        details: item.details,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
    },
    { status: 200 },
  );
}
