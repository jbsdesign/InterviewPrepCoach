import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";

export const runtime = "nodejs";

async function getCurrentUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  return payload.userId;
}

function extractProfileFromText(text: string) {
  const rawLines = text.split(/\r?\n/);

  const lines = rawLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      fullName: null,
      headline: null,
      currentRole: null,
      company: null,
      yearsExperience: null,
      location: null,
      summary: null,
      extraContext: text.slice(0, 4000),
    };
  }

  // Heuristic: first line that looks like a name (2-5 words, no @, no URL)
  const nameCandidate = lines.find((line) => {
    if (/@|https?:\/\//i.test(line)) return false;
    const wordCount = line.split(/\s+/).length;
    return wordCount >= 2 && wordCount <= 5;
  });

  const fullName = nameCandidate ?? lines[0];

  // Headline or top-of-resume current role: scan a few lines after the name.
  const nameIndex = lines.indexOf(fullName);
  let headline: string | null = null;
  let currentRole: string | null = null;
  let company: string | null = null;

  for (let i = nameIndex + 1; i < Math.min(lines.length, nameIndex + 6); i++) {
    const line = lines[i];
    if (/@|https?:\/\//i.test(line)) continue; // skip contact lines
    if (line.length > 160) continue; // very long paragraphs are likely summary/body

    // If the line looks like "Role at Company" or "Role @ Company", treat it as
    // the current role + company instead of a generic headline.
    const topMatch = line.match(/^(.*?)(?: at | @ )(.*)$/i);
    if (topMatch) {
      const roleCandidate = topMatch[1].trim();
      const companyCandidate = topMatch[2].trim();
      if (roleCandidate && companyCandidate) {
        currentRole = currentRole ?? roleCandidate;
        company = company ?? companyCandidate;
        break;
      }
    } else {
      // Otherwise, use the first reasonable non-contact line as a headline/tagline.
      headline = line;
      break;
    }
  }

  // Current role + company: if we did not find them near the top, look near an
  // Experience section for a "Role at Company" pattern.
  const experienceIdx = lines.findIndex((line) =>
    /experience|work history|employment history/i.test(line),
  );

  const searchStart = experienceIdx > -1 ? experienceIdx : nameIndex;
  const roleSearchWindow = lines.slice(searchStart, searchStart + 20);

  if (!currentRole || !company) {
    for (const line of roleSearchWindow) {
      const match = line.match(/^(.*?)(?: at | @ )(.*)$/i);
      if (match) {
        const roleCandidate = match[1].trim();
        const companyCandidate = match[2].trim();
        if (roleCandidate && companyCandidate) {
          currentRole = currentRole ?? roleCandidate;
          company = company ?? companyCandidate;
          break;
        }
      }
    }
  }

  // Summary: text between a "Summary/Profile" heading and the Experience section,
  // otherwise the first few non-contact lines after the name.
  let summary: string | null = null;
  const summaryHeadingIdx = lines.findIndex((line) =>
    /summary|profile/i.test(line),
  );

  if (summaryHeadingIdx > -1 && experienceIdx > summaryHeadingIdx) {
    summary = lines.slice(summaryHeadingIdx + 1, experienceIdx).join(" ");
  } else if (experienceIdx > nameIndex + 1) {
    summary = lines.slice(nameIndex + 1, experienceIdx).join(" ");
  } else {
    summary = lines.slice(nameIndex + 1, Math.min(lines.length, nameIndex + 6)).join(
      " ",
    );
  }

  return {
    fullName,
    headline,
    currentRole,
    company,
    yearsExperience: null,
    location: null,
    summary,
    extraContext: text.slice(0, 4000),
  };
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

  let text: string;

  if (isText) {
    text = await file.text();
  } else if (isPdf) {
    // Use an external Node helper script so pdf-parse/pdfjs can run in a plain Node context
    // without Turbopack worker bundling issues.
    try {
      const tmpDir = await mkdtemp(join(tmpdir(), "ipc-resume-"));
      const pdfPath = join(tmpDir, file.name || "resume.pdf");
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(pdfPath, Buffer.from(arrayBuffer));

      const { stdout } = await new Promise<{ stdout: string }>((resolve, reject) => {
        execFile("node", ["scripts/parse-pdf-cli.mjs", pdfPath], (error, stdout, stderr) => {
          if (error) {
            reject(new Error(stderr || error.message));
            return;
          }
          resolve({ stdout });
        });
      });

      text = stdout;

      // Best-effort cleanup of the temp file/directory.
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Unable to parse that PDF";

      return NextResponse.json(
        { error: `Unable to parse PDF resume: ${message}` },
        { status: 400 },
      );
    }
  } else {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a .pdf or .txt resume." },
      { status: 400 },
    );
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: "That file appears to be empty" },
      { status: 400 },
    );
  }

  const suggestions = extractProfileFromText(text);

  return NextResponse.json(
    {
      success: true,
      suggestions,
    },
    { status: 200 },
  );
}
