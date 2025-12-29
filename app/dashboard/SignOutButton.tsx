"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    try {
      setIsSigningOut(true);
      setError(null);

      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });

      if (!response.ok) {
        setError("Unable to sign out. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
