import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { mkdir, writeFile, stat, unlink, readdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

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
    return NextResponse.json({ documents: [] }, { status: 200 });
  }

  const baseDir = join(process.cwd(), "uploads", "supporting", userId);

  try {
    const entries = await readdir(baseDir, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile());

    const documents = await Promise.all(
      files.map(async (entry) => {
        const storedName = entry.name;
        const fullPath = join(baseDir, storedName);
        const info = await stat(fullPath);

        const originalName = storedName.length > 37 ? storedName.slice(37) : storedName;

        return {
          storedName,
          fileName: originalName,
          size: info.size,
        };
      }),
    );

    return NextResponse.json({ documents }, { status: 200 });
  } catch {
    // No directory or unreadable; treat as no documents.
    return NextResponse.json({ documents: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const files = formData
    .getAll("supporting")
    .filter((value) => value instanceof File) as File[];

  if (files.length === 0) {
    return NextResponse.json(
      { error: "No supporting documents were provided" },
      { status: 400 },
    );
  }

  const baseDir = join(process.cwd(), "uploads", "supporting", userId);
  await mkdir(baseDir, { recursive: true });

  const saved: { fileName: string; path: string; size: number; type: string }[] = [];

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeName = file.name || "document";
    const uniqueName = `${randomUUID()}-${safeName}`;
    const targetPath = join(baseDir, uniqueName);

    await writeFile(targetPath, buffer);

    saved.push({
      fileName: safeName,
      path: targetPath,
      size: buffer.byteLength,
      type: file.type || "application/octet-stream",
    });
  }

  return NextResponse.json(
    {
      success: true,
      documents: saved.map((doc) => ({
        fileName: doc.fileName,
        size: doc.size,
        type: doc.type,
      })),
    },
    { status: 200 },
  );
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId(req);

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let storedName: string | undefined;
  try {
    const body = (await req.json().catch(() => null)) as
      | { storedName?: string }
      | null;
    storedName = body?.storedName;
  } catch {
    storedName = undefined;
  }

  if (!storedName) {
    return NextResponse.json(
      { error: "Missing document identifier" },
      { status: 400 },
    );
  }

  const baseDir = join(process.cwd(), "uploads", "supporting", userId);
  const targetPath = join(baseDir, storedName);

  try {
    // Ensure the file exists before attempting to delete it.
    await stat(targetPath);
  } catch {
    return NextResponse.json(
      { error: "Document not found" },
      { status: 404 },
    );
  }

  try {
    await unlink(targetPath);
  } catch {
    return NextResponse.json(
      { error: "Unable to delete that document" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
