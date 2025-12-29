"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingForm, OnboardingInitialProfile } from "./OnboardingForm";

const DROPZONE_BASE_CLASSES =
  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center text-sm transition";

export type OnboardingWizardProps = {
  initialName: string;
};

export function OnboardingWizard({ initialName }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<"choice" | "form" | "supporting">("choice");
  const [initialProfile, setInitialProfile] = useState<OnboardingInitialProfile>({
    fullName: initialName,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [supportingText, setSupportingText] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [isSavingSupporting, setIsSavingSupporting] = useState(false);
  const [supportingError, setSupportingError] = useState<string | null>(null);

  function goToManualForm() {
    setInitialProfile({ fullName: initialName });
    setStep("form");
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setUploadError(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setIsUploading(true);

      const response = await fetch("/api/profile/upload-resume", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !data.success) {
        setUploadError(
          data.error ||
            "Unable to read that file. Please upload a .pdf or .txt resume, or enter details manually.",
        );
        return;
      }

      setResumeFileName(file.name);
      setStep("supporting");
    } catch {
      setUploadError(
        "Unable to read that file. Please upload a .pdf or .txt resume, or enter details manually.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleSupportingDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    setSupportingFiles((prev) => [...prev, ...Array.from(files)]);
  }

  function handleSupportingDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  async function handleSupportingSubmit() {
    try {
      setIsSavingSupporting(true);
      setSupportingError(null);

      // First, save the high level profile context.
      const profileResponse = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: initialName,
          extraContext: supportingText || null,
          resumeFileName: resumeFileName ?? null,
        }),
      });

      const profileData = (await profileResponse.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!profileResponse.ok || !profileData.success) {
        setSupportingError(
          profileData.error || "Something went wrong while saving your details.",
        );
        return;
      }

      // Then, if there are supporting files, upload them via a dedicated endpoint.
      if (supportingFiles.length > 0) {
        const formData = new FormData();
        for (const file of supportingFiles) {
          formData.append("supporting", file);
        }

        const uploadResponse = await fetch(
          "/api/profile/supporting-documents",
          {
            method: "POST",
            body: formData,
          },
        );

        const uploadData = (await uploadResponse
          .json()
          .catch(() => ({}))) as {
          error?: string;
          success?: boolean;
        };

        if (!uploadResponse.ok || !uploadData.success) {
          setSupportingError(
            uploadData.error ||
              "We saved your profile, but there was an issue uploading supporting documents.",
          );
          return;
        }
      }

      router.refresh();
    } catch {
      setSupportingError("Something went wrong while saving your details.");
    } finally {
      setIsSavingSupporting(false);
    }
  }

  if (step === "form") {
    return (
      <div className="space-y-6">
        <div className="mb-4 flex items-start gap-3">
          <button
            type="button"
            onClick={() => setStep("choice")}
            aria-label="Back to options"
            className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-zinc-900 shadow-sm backdrop-blur-md transition hover:bg-white/20 dark:border-zinc-600/60 dark:bg-zinc-900/40 dark:text-zinc-50 dark:hover:bg-zinc-900/70"
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
          <div>
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Tell us about your background
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              We use this information to tailor interview prep to your experience and goals.
            </p>
          </div>
        </div>

        <OnboardingForm initial={initialProfile} />
      </div>
    );
  }

  if (step === "supporting") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Resume successfully uploaded
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Next, you can add any additional supporting documents or context that will
            help tailor your prep, such as peer feedback, certifications, awards, or
            patents. You can describe them in your own words here.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="supportingText"
            className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Additional details (optional)
          </label>
          <textarea
            id="supportingText"
            rows={5}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
            placeholder="For example: links to portfolios, performance reviews, 360 feedback, major wins, certifications, awards, patents, or anything else you want this coach to know."
            value={supportingText}
            onChange={(event) => setSupportingText(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Upload supporting documents (optional)
          </label>
          <div
            className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/60 p-4 text-center text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300"
            onDrop={handleSupportingDrop}
            onDragOver={handleSupportingDragOver}
          >
            <p className="mb-2">Drag and drop files here</p>
            <p className="mb-3 text-[11px] text-zinc-500 dark:text-zinc-400">
              You can attach things like PDFs, images, or text files with feedback, reviews, or awards.
            </p>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = event.target.files;
                  if (!files) {
                    setSupportingFiles([]);
                    return;
                  }
                  setSupportingFiles(Array.from(files));
                }}
              />
              <span>Choose files</span>
            </label>
            {supportingFiles.length > 0 && (
              <p className="mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                {supportingFiles.length} file
                {supportingFiles.length === 1 ? "" : "s"} selected
              </p>
            )}
          </div>
        </div>

        {supportingError && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {supportingError}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleSupportingSubmit}
            disabled={isSavingSupporting}
            className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 sm:w-auto"
          >
            {isSavingSupporting ? "Saving..." : "Save and continue"}
          </button>
          <button
            type="button"
            onClick={handleSupportingSubmit}
            disabled={isSavingSupporting}
            className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800 sm:w-auto"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Tell us about your background
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Start by telling us about your experience. You can upload a recent resume
          or enter everything manually.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Option 1: Upload your resume
          </h2>
          <div
            className={`${DROPZONE_BASE_CLASSES} border-zinc-300 bg-zinc-50/60 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-zinc-500`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <p className="mb-2 text-sm font-medium">
              Drag and drop a PDF or TXT file here
            </p>
            <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
              We will read your resume to understand your background. You can add
              more details on the next step.
            </p>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800">
              <input
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <span>{isUploading ? "Reading resume..." : "Choose a file"}</span>
            </label>
            {uploadError && (
              <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                {uploadError}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Option 2: Enter details manually
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            If you prefer not to upload a resume, you can fill in your background and
            experience by hand.
          </p>
          <button
            type="button"
            onClick={goToManualForm}
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
          >
            Enter details manually
          </button>
        </div>
      </div>
    </div>
  );
}
