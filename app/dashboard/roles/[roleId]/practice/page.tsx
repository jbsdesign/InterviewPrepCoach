import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { UserMenu } from "../../../UserMenu";
import { PracticeInterviewClient } from "../../PracticeInterviewClient";

export default async function PracticeInterviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ roleId: string }>;
  searchParams: Promise<{ interviewId?: string }>;
}) {
  const [{ roleId }, search] = await Promise.all([params, searchParams]);
  const interviewId = search?.interviewId ?? undefined;
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
  });

  if (!role) {
    redirect("/dashboard");
  }

  const displayName = user.name || user.email;

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
        <div className="w-full h-[70vh] min-h-[460px] max-h-[720px] overflow-hidden rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-950">
          <PracticeInterviewClient
            roleId={role.id}
            roleTitle={role.title}
            company={role.company}
            interviewId={interviewId}
          />
        </div>
      </main>
    </div>
  );
}
