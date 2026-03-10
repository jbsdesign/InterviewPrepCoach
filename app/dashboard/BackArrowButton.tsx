"use client";

import { useRouter } from "next/navigation";

export function BackArrowButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-zinc-900 shadow-sm backdrop-blur-md transition hover:bg-white/20 dark:border-zinc-600/60 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900/70"
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
    </button>
  );
}
