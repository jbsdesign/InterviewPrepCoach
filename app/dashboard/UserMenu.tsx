"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

type SupportingDoc = {
  storedName: string;
  fileName: string;
  size: number;
};

type UserMenuProps = {
  email: string;
  displayName: string;
  userId?: string;
};

export function UserMenu({ email, displayName }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [docs, setDocs] = useState<SupportingDoc[]>([]);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [hasLoadedDocs, setHasLoadedDocs] = useState(false);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [deletingDocByName, setDeletingDocByName] = useState<
    Record<string, boolean>
  >({});
  const [replacingStoredName, setReplacingStoredName] = useState<string | null>(
    null,
  );

  const addInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  // Clear any pending auto close timeout when the menu unmounts.
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  function toggleTheme() {
    if (typeof document === "undefined") return;
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // ignore
    }
    setTheme(next);
  }

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

  async function loadDocuments() {
    try {
      setIsLoadingDocs(true);
      setDocsError(null);

      const response = await fetch("/api/profile/supporting-documents", {
        method: "GET",
      });

      const data = (await response.json().catch(() => ({}))) as {
        documents?: SupportingDoc[];
        error?: string;
      };

      if (!response.ok) {
        setDocsError(data.error || "Unable to load documents. Please try again.");
        return;
      }

      setDocs(data.documents ?? []);
      setHasLoadedDocs(true);
    } catch {
      setDocsError("Unable to load documents. Please try again.");
    } finally {
      setIsLoadingDocs(false);
    }
  }

  function scheduleAutoClose() {
    if (!isOpen) return;
    if (typeof window === "undefined") return;
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 2000);
  }

  function cancelAutoClose() {
    if (typeof window === "undefined") return;
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  function toggleOpen() {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !hasLoadedDocs) {
      void loadDocuments();
    }
    if (!next) {
      cancelAutoClose();
    }
  }
  async function handleAddDocuments(files: FileList | null) {
    if (!files || files.length === 0) return;

    try {
      setIsAddingDoc(true);
      setDocsError(null);

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("supporting", file);
      });

      const response = await fetch("/api/profile/supporting-documents", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !data.success) {
        setDocsError(
          data.error || "There was a problem uploading that document. Please try again.",
        );
        return;
      }

      await loadDocuments();
    } catch {
      setDocsError(
        "There was a problem uploading that document. Please try again.",
      );
    } finally {
      setIsAddingDoc(false);
      if (addInputRef.current) {
        addInputRef.current.value = "";
      }
    }
  }

  async function handleReplaceDocument(files: FileList | null) {
    if (!files || files.length === 0 || !replacingStoredName) return;

    const file = files[0];
    if (!file) return;

    try {
      setDocsError(null);

      const formData = new FormData();
      formData.append("supporting", file);

      const uploadResponse = await fetch("/api/profile/supporting-documents", {
        method: "POST",
        body: formData,
      });

      const uploadData = (await uploadResponse.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!uploadResponse.ok || !uploadData.success) {
        setDocsError(
          uploadData.error ||
            "There was a problem updating that document. Please try again.",
        );
        return;
      }

      const deleteResponse = await fetch("/api/profile/supporting-documents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storedName: replacingStoredName }),
      });

      const deleteData = (await deleteResponse.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!deleteResponse.ok || !deleteData.success) {
        setDocsError(
          deleteData.error ||
            "There was a problem updating that document. Please try again.",
        );
        return;
      }

      await loadDocuments();
    } catch {
      setDocsError(
        "There was a problem updating that document. Please try again.",
      );
    } finally {
      setReplacingStoredName(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = "";
      }
    }
  }

  async function handleDeleteDocument(storedName: string) {
    try {
      setDeletingDocByName((prev) => ({ ...prev, [storedName]: true }));
      setDocsError(null);

      const response = await fetch("/api/profile/supporting-documents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ storedName }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !data.success) {
        setDocsError(
          data.error || "Unable to delete that document. Please try again.",
        );
        return;
      }

      setDocs((prev) => prev.filter((doc) => doc.storedName !== storedName));
    } catch {
      setDocsError("Unable to delete that document. Please try again.");
    } finally {
      setDeletingDocByName((prev) => ({ ...prev, [storedName]: false }));
    }
  }

  function handleAddClick() {
    if (addInputRef.current) {
      addInputRef.current.click();
    }
  }

  function handleDocClick(doc: SupportingDoc) {
    setReplacingStoredName(doc.storedName);
    if (replaceInputRef.current) {
      replaceInputRef.current.click();
    }
  }

  const visibleDocs = docs.slice(0, 5);
  const hasMoreDocs = docs.length > 5;

  return (
    <div
      className="relative inline-block text-left"
      onMouseEnter={cancelAutoClose}
      onMouseLeave={scheduleAutoClose}
    >
      <input
        ref={addInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(event) => handleAddDocuments(event.target.files)}
      />
      <input
        ref={replaceInputRef}
        type="file"
        className="hidden"
        onChange={(event) => handleReplaceDocument(event.target.files)}
      />

      <button
        type="button"
        onClick={toggleOpen}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        <span className="truncate max-w-[160px] text-left text-[11px] leading-tight">
          {displayName}
        </span>
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0, y: isOpen ? -1 : 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="text-[10px] text-zinc-500 dark:text-zinc-400"
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="user-menu-panel"
            initial={{ opacity: 0, y: -10, scale: 0.9, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, scale: 0.9, filter: "blur(6px)" }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            onMouseEnter={cancelAutoClose}
            onMouseLeave={scheduleAutoClose}
            className="absolute right-0 z-[999] mt-2 w-80 overflow-hidden rounded-xl border border-zinc-200 bg-white p-2 text-[12px] shadow-[0_18px_45px_rgba(15,23,42,0.55)] dark:border-zinc-700 dark:bg-zinc-950"
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.06),transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.05),transparent_55%)]"
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            <div className="relative z-10">
          <div className="mb-2 border-b border-zinc-100/70 pb-2 text-[12px] text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-300">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">
                {displayName}
              </div>
              <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                {email}
              </div>
            </div>
          </div>

          <div className="mb-2 space-y-1 text-[12px]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard");
              }}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <span>Your roles</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                router.push("/dashboard/profile");
              }}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left font-medium text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <span>Edit profile</span>
            </button>

            <div className="mt-1 border-t border-zinc-200 pt-1 dark:border-zinc-700" />

            <div className="flex items-center justify-between px-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Your documents
              </p>
              <button
                type="button"
                onClick={handleAddClick}
                className="text-[12px] font-semibold text-zinc-900 hover:text-zinc-950 dark:text-zinc-50 dark:hover:text-zinc-100"
              >
                + Add new
              </button>
            </div>

            {isAddingDoc && (
              <p className="px-2 text-[11px] text-zinc-500 dark:text-zinc-400">Uploading...</p>
            )}

            {isLoadingDocs && (
              <p className="px-2 py-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                Loading documents...
              </p>
            )}

            {docsError && (
              <p className="px-2 py-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                {docsError}
              </p>
            )}

            {visibleDocs.map((doc) => (
              <div
                key={doc.storedName}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-[11px] hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <button
                  type="button"
                  onClick={() => handleDocClick(doc)}
                  className="flex-1 truncate text-left text-[12px] font-medium text-zinc-900 hover:underline dark:text-zinc-50"
                >
                  {doc.fileName}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDocument(doc.storedName)}
                  disabled={!!deletingDocByName[doc.storedName]}
                  aria-label="Delete document"
                  className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-red-600 transition hover:text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-4 w-4"
                  >
                    <path
                      d="M9 3.5h6M4 6.5h16M18 6.5l-.7 10.06A2 2 0 0 1 15.3 18.5H8.7a2 2 0 0 1-1.99-1.94L6 6.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 10.5v5M14 10.5v5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))}

            {hasMoreDocs && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard/profile");
                }}
                className="mt-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] font-medium text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <span>View all documents</span>
              </button>
            )}
          </div>

          <div className="mt-1 border-t border-zinc-200 pt-1 text-[12px] dark:border-zinc-700">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] font-medium text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <span>{theme === "light" ? "Light view" : "Dark view"}</span>
              <span
                className={`relative inline-flex h-4 w-7 items-center rounded-full border transition-colors ${
                  theme === "light"
                    ? "border-zinc-600 bg-zinc-800"
                    : "border-zinc-300 bg-zinc-200"
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full bg-white shadow transition-transform ${
                    theme === "light" ? "translate-x-3" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
          </div>

          <button
            type="button"
            disabled={isSigningOut}
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
          </button>

          {error && (
            <p className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">{error}</p>
          )}
            </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
