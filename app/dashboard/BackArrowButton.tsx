"use client";

import { useRouter } from "next/navigation";

export function BackArrowButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-white/10 text-zinc-900 shadow-sm backdrop-blur-md transition hover:bg-white/20 dark:border-zinc-600/60 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900/70"
    >
      <span className="text-lg leading-none">
        
      </span>
    </button>
  );
}
