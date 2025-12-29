"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type OnboardingInitialProfile = {
  fullName?: string;
  headline?: string;
  currentRole?: string;
  company?: string;
  yearsExperience?: string;
  location?: string;
  summary?: string;
  extraContext?: string;
  resumeFileName?: string | null;
};

type OnboardingFormProps = {
  initial: OnboardingInitialProfile;
};

export function OnboardingForm({ initial }: OnboardingFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(initial.fullName ?? "");
  const [headline, setHeadline] = useState(initial.headline ?? "");
  const [currentRole, setCurrentRole] = useState(initial.currentRole ?? "");
  const [company, setCompany] = useState(initial.company ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    initial.yearsExperience ?? "",
  );
  const [location, setLocation] = useState(initial.location ?? "");
  const [summary, setSummary] = useState(initial.summary ?? "");
  const [extraContext, setExtraContext] = useState(initial.extraContext ?? "");
  const [resumeFileName] = useState<string | null>(
    initial.resumeFileName ?? null,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          headline,
          currentRole,
          company,
          yearsExperience,
          location,
          summary,
          extraContext,
          resumeFileName,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label
          htmlFor="fullName"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
          placeholder="Ada Lovelace"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="headline"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Headline
        </label>
        <input
          id="headline"
          type="text"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
          placeholder="Senior product manager focused on B2B SaaS"
          value={headline}
          onChange={(event) => setHeadline(event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="currentRole"
            className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Current role
          </label>
          <input
            id="currentRole"
            type="text"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
            placeholder="Senior Software Engineer"
            value={currentRole}
            onChange={(event) => setCurrentRole(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="company"
            className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Company
          </label>
          <input
            id="company"
            type="text"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
            placeholder="Acme Corp"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="yearsExperience"
            className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Years of experience
          </label>
          <input
            id="yearsExperience"
            type="number"
            min={0}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
            placeholder="5"
            value={yearsExperience}
            onChange={(event) => setYearsExperience(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="location"
            className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Location
          </label>
          <input
            id="location"
            type="text"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
            placeholder="New York, NY (hybrid)"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="summary"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Professional summary
        </label>
        <textarea
          id="summary"
          rows={4}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
          placeholder="Give a high level overview of your experience and strengths."
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="extraContext"
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
        >
          Additional context (optional)
        </label>
        <textarea
          id="extraContext"
          rows={4}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
          placeholder="Link to your resume, portfolios, or anything else that would help tailor your prep."
          value={extraContext}
          onChange={(event) => setExtraContext(event.target.value)}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {isSubmitting ? "Saving..." : "Save and continue"}
      </button>
    </form>
  );
}
