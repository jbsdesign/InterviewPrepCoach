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

export async function GET(req: NextRequest) {
  const prisma = getPrisma();
  const userId = await getCurrentUserId(req);

  if (!userId) {
    return NextResponse.json({ profile: null }, { status: 200 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return NextResponse.json({ profile: null }, { status: 200 });
  }

  return NextResponse.json(
    {
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        headline: profile.headline,
        currentRole: profile.currentRole,
        company: profile.company,
        yearsExperience: profile.yearsExperience,
        location: profile.location,
        summary: profile.summary,
        extraContext: profile.extraContext,
        resumeFileName: profile.resumeFileName,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
      },
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  const prisma = getPrisma();
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

  const {
    fullName,
    headline,
    currentRole,
    company,
    yearsExperience,
    location,
    summary,
    extraContext,
    resumeFileName,
  } = (body ?? {}) as {
    fullName?: unknown;
    headline?: unknown;
    currentRole?: unknown;
    company?: unknown;
    yearsExperience?: unknown;
    location?: unknown;
    summary?: unknown;
    extraContext?: unknown;
    resumeFileName?: unknown;
  };

  if (typeof fullName !== "string" || !fullName.trim()) {
    return NextResponse.json(
      { error: "Full name is required" },
      { status: 400 },
    );
  }

  const parsedYearsExperience =
    typeof yearsExperience === "number"
      ? yearsExperience
      : typeof yearsExperience === "string" && yearsExperience.trim() !== ""
      ? Number.parseInt(yearsExperience, 10)
      : null;

  if (parsedYearsExperience !== null && Number.isNaN(parsedYearsExperience)) {
    return NextResponse.json(
      { error: "Years of experience must be a number" },
      { status: 400 },
    );
  }

  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        fullName: fullName.trim(),
        headline: typeof headline === "string" ? headline.trim() || null : null,
        currentRole:
          typeof currentRole === "string" ? currentRole.trim() || null : null,
        company: typeof company === "string" ? company.trim() || null : null,
        yearsExperience: parsedYearsExperience,
        location: typeof location === "string" ? location.trim() || null : null,
        summary: typeof summary === "string" ? summary.trim() || null : null,
        extraContext:
          typeof extraContext === "string" ? extraContext.trim() || null : null,
        resumeFileName:
          typeof resumeFileName === "string" && resumeFileName.trim() !== ""
            ? resumeFileName.trim()
            : null,
      },
      create: {
        userId,
        fullName: fullName.trim(),
        headline: typeof headline === "string" ? headline.trim() || null : null,
        currentRole:
          typeof currentRole === "string" ? currentRole.trim() || null : null,
        company: typeof company === "string" ? company.trim() || null : null,
        yearsExperience: parsedYearsExperience,
        location: typeof location === "string" ? location.trim() || null : null,
        summary: typeof summary === "string" ? summary.trim() || null : null,
        extraContext:
          typeof extraContext === "string" ? extraContext.trim() || null : null,
        resumeFileName:
          typeof resumeFileName === "string" && resumeFileName.trim() !== ""
            ? resumeFileName.trim()
            : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        profile: {
          id: profile.id,
          fullName: profile.fullName,
          headline: profile.headline,
          currentRole: profile.currentRole,
          company: profile.company,
          yearsExperience: profile.yearsExperience,
          location: profile.location,
          summary: profile.summary,
          extraContext: profile.extraContext,
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString(),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
