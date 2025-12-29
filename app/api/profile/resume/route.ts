import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";

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

  const formData = await req.formData();
  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing resume file" },
      { status: 400 },
    );
  }

  const lowerName = (file.name || "").toLowerCase();
  const mimeType = (file.type || "").toLowerCase();

  const isText =
    lowerName.endsWith(".txt") ||
    mimeType === "text/plain" ||
    mimeType === "text/markdown";
  const isPdf =
    lowerName.endsWith(".pdf") ||
    mimeType === "application/pdf" ||
    mimeType === "application/x-pdf";

  if (!isText && !isPdf) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a .pdf or .txt resume." },
      { status: 400 },
    );
  }

  const safeName = file.name || (isPdf ? "resume.pdf" : "resume.txt");

  // Ensure the user exists and compute a fallback full name if we need to create a profile.
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 },
    );
  }

  const fallbackFullName = user.name || user.email || "New user";

  try {
    const existing = await prisma.userProfile.findUnique({ where: { userId } });

    if (existing) {
      await prisma.userProfile.update({
        where: { userId },
        data: { resumeFileName: safeName },
      });
    } else {
      await prisma.userProfile.create({
        data: {
          userId,
          fullName: fallbackFullName,
          resumeFileName: safeName,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        resumeFileName: safeName,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unable to update resume";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
