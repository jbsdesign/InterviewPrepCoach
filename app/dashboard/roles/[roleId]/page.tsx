import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { RoleDetailClient } from "../RoleDetailClient";
import { UserMenu } from "../../UserMenu";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;
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

  const role = await prisma.role.findFirst({
    where: { id: roleId, userId: user.id },
    include: {
      interviews: {
        orderBy: { createdAt: "asc" },
      },
      prepItems: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!role) {
    redirect("/dashboard");
  }

  const displayName = user.name || user.email;

  const roleForClient = {
    id: role.id,
    title: role.title,
    company: role.company,
    level: role.level,
    description: role.description,
  };

  const interviewsForClient = role.interviews.map((iv) => ({
    id: iv.id,
    interviewerType: iv.interviewerType,
    interviewerName: iv.interviewerName,
    notes: iv.notes,
    scheduledAt: iv.scheduledAt ? iv.scheduledAt.toISOString() : null,
    createdAt: iv.createdAt.toISOString(),
  }));

  const prepItemsForClient = role.prepItems.map((item) => ({
    id: item.id,
    title: item.title,
    details: item.details,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

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
          <div className="mb-4 flex items-start gap-3">
  <Link
        href="/dashboard"
        className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-zinc-900 shadow-sm backdrop-blur-md transition hover:bg-white/20 dark:border-zinc-600/60 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900/70"
        aria-label="Back to roles"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-zinc-900 dark:text-zinc-50"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        <path
          d="M12 8l-4 4 4 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      <line
            x1="8.5"
            y1="12"
            x2="16.5"
            y2="12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </Link>
            <div className="min-w-0 flex-1">
              <h1 className="mb-0.5 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                {role.company || "Company"}
              </h1>
              <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {role.title}
                {role.level && (
                  <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    {" "}· {role.level}
                  </span>
                )}
              </p>
            </div>
          </div>

          <RoleDetailClient
            initialRole={roleForClient}
            initialInterviews={interviewsForClient}
            initialPrepItems={prepItemsForClient}
          />

          <p className="mt-6 text-[11px] text-zinc-500 dark:text-zinc-500">
            Viewing as {displayName}. You can manage this role from your main
            dashboard.
          </p>
        </div>
      </main>
    </div>
  );
}
