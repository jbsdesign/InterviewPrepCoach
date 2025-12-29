"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem("theme");
    } catch {
      stored = null;
    }

    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    const initialTheme: "light" | "dark" =
      stored === "light" || stored === "dark"
        ? (stored as "light" | "dark")
        : prefersDark
        ? "dark"
        : "light";

    const root = document.documentElement;
    if (initialTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  return null;
}
