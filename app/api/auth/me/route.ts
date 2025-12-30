import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Temporary implementation for Vercel deploy:
  // Always report "no user" instead of touching the database.
  return NextResponse.json({ user: null }, { status: 200 });
}