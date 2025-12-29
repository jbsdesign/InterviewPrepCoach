import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/passwords";
import { AUTH_COOKIE_NAME, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
  };

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = createSessionToken(user.id);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        },
      },
      { status: 200 },
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to sign in" },
      { status: 500 },
    );
  }
}
