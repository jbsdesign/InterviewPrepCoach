"use client";

import { useEffect, useState } from "react";

type BrandName =
  | "default"
  | "google"
  | "duolingo"
  | "adobe"
  | "hubspot"
  | "instagram"
  | "dribbble";

const BRANDS: { id: BrandName; label: string }[] = [
  { id: "default", label: "System" },
  { id: "google", label: "Google" },
  { id: "duolingo", label: "Duolingo" },
  { id: "adobe", label: "Adobe" },
  { id: "hubspot", label: "HubSpot" },
  { id: "instagram", label: "Instagram" },
  { id: "dribbble", label: "Dribbble" },
];

const BRAND_CLASSNAMES: string[] = [
  "brand-google",
  "brand-duolingo",
  "brand-adobe",
  "brand-hubspot",
  "brand-instagram",
  "brand-dribbble",
];

function getInitialBrand(): BrandName {
  if (typeof document === "undefined") return "default";

  const root = document.documentElement;
  for (const entry of BRANDS) {
    if (entry.id === "default") continue;
    if (root.classList.contains(`brand-${entry.id}`)) {
      return entry.id;
    }
  }

  try {
    const stored = window.localStorage.getItem("brand");
    if (
      stored === "google" ||
      stored === "duolingo" ||
      stored === "adobe" ||
      stored === "hubspot" ||
      stored === "instagram" ||
      stored === "dribbble"
    ) {
      return stored;
    }
  } catch {
    // ignore storage errors
  }

  return "default";
}

function applyBrandClass(next: BrandName) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove(...BRAND_CLASSNAMES);
  if (next !== "default") {
    root.classList.add(`brand-${next}`);
  }
  try {
    window.localStorage.setItem("brand", next);
  } catch {
    // ignore storage errors
  }
}

export function BrandSwitcher({ compact = false }: { compact?: boolean }) {
  const [brand, setBrand] = useState<BrandName>("default");

  useEffect(() => {
    const initial = getInitialBrand();
    setBrand(initial);
  }, []);

  function handleChange(next: BrandName) {
    setBrand(next);
    applyBrandClass(next);
  }

  return (
    <select
      value={brand}
      onChange={(event) => handleChange(event.target.value as BrandName)}
      className={
        compact
          ? "inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm outline-none ring-0 hover:bg-zinc-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:border-sky-400 dark:focus:ring-sky-500/40"
          : "inline-flex max-w-[180px] items-center rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm outline-none ring-0 hover:bg-zinc-50 focus:border-sky-500 focus:ring-1 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:border-sky-400 dark:focus:ring-sky-500/40"
      }
    >
      {BRANDS.map((entry) => (
        <option key={entry.id} value={entry.id}>
          {entry.label}
        </option>
      ))}
    </select>
  );
}
