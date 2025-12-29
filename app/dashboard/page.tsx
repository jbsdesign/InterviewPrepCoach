import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { OnboardingWizard } from "./OnboardingWizard";
import { UserMenu } from "./UserMenu";
import { RolesSection } from "./RolesSection";

export default async function DashboardPage() {
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

  const roles = await prisma.role?.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const upcomingInterviews = await prisma.roleInterview.findMany({
    where: {
      role: { userId: user.id },
      scheduledAt: { not: null, gte: new Date() },
    },
    include: {
      role: {
        select: { id: true, title: true, company: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const displayName = user.name || user.email;

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Interview Prep Coach
            </div>
            <UserMenu userId={user.id} email={user.email} displayName={displayName} />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-5xl flex-1 px-4 py-8">
          <div className="w-full rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-950">
            <OnboardingWizard initialName={displayName} />
          </div>
        </main>
      </div>
    );
  }

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
        <section className="px-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Welcome back, {displayName}
          </h1>
        </section>

        <RolesSection
          initialRoles={(roles ?? []).map((role) => ({
            id: role.id,
            title: role.title,
            company: role.company,
            level: role.level,
            description: role.description,
            status: role.status,
            createdAt: role.createdAt.toISOString(),
          }))}
          initialUpcomingInterviews={upcomingInterviews.map((iv) => ({
            id: iv.id,
            roleId: iv.roleId,
            roleTitle: iv.role.title,
            company: iv.role.company,
            interviewerType: iv.interviewerType,
            interviewerName: iv.interviewerName,
            scheduledAt: iv.scheduledAt ? iv.scheduledAt.toISOString() : "",
            notes: iv.notes ?? null,
          }))}
        />
      </main>
    </div>
  );
}
