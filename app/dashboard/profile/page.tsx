import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { ProfileDocumentsClient } from "./ProfileDocumentsClient";
import { UserMenu } from "../UserMenu";

export default async function ProfilePage() {
  const prisma = getPrisma();
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/");
  }

  const payload = verifySessionToken(token);

  if (!payload) {
    redirect("/");
  }

  const user = await prisma.user?.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    redirect("/");
  }

  const profile = await prisma.userProfile?.findUnique({
    where: { userId: user.id },
  });

  const displayName = user.name || user.email;

  // Discover supporting documents on disk for this user.
  const supportingDir = join(process.cwd(), "uploads", "supporting", user.id);
  let supportingDocs: { storedName: string; fileName: string; size: number }[] = [];

  try {
    const entries = await fs.readdir(supportingDir, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile());

    supportingDocs = await Promise.all(
      files.map(async (entry) => {
        const fullPath = join(supportingDir, entry.name);
        const stats = await fs.stat(fullPath);

        // Stored name is `${uuid}-${originalName}`; recover originalName best-effort.
        const stored = entry.name;
        const originalName = stored.length > 37 ? stored.slice(37) : stored;

        return {
          storedName: stored,
          fileName: originalName,
          size: stats.size,
        };
      }),
    );
  } catch {
    // No supporting directory or unreadable; treat as no documents.
    supportingDocs = [];
  }

  const hasResume = !!profile?.resumeFileName;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="relative z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Interview Prep Coach
          </div>
          <UserMenu userId={user.id} email={user.email} displayName={displayName} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 gap-6">
        <div className="w-full rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-950">
          <h1 className="mb-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Profile
          </h1>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Documents and information you have shared with Interview Prep Coach.
          </p>

          <ProfileDocumentsClient
            displayName={displayName}
            email={user.email}
            hasResume={hasResume}
            resumeFileName={profile?.resumeFileName ?? null}
            initialSupportingDocs={supportingDocs}
          />
        </div>
      </main>
    </div>
  );
}
