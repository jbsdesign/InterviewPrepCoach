"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type CurrentUser = {
  email: string;
  name?: string | null;
};

const primaryButtonClasses =
  "flex w-full items-center justify-center rounded-xl bg-zinc-900 px-3 py-2.5 text-sm font-medium text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 dark:focus-visible:outline-zinc-300";

function AuthBackground() {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-900 via-slate-950 to-indigo-950"
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-20%] rounded-[4rem] bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.45),transparent_55%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.4),transparent_60%),radial-gradient(circle_at_0%_100%,rgba(129,140,248,0.4),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.45),transparent_55%)] mix-blend-screen"
        initial={{ x: "-4%", y: "-3%", rotate: -4 }}
        animate={{
          x: ["-4%", "4%", "-2%", "-4%"],
          y: ["-3%", "3%", "1%", "-3%"],
          rotate: [-4, 3, -1, -4],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function AuthLayout({ children, showSuccess }: { children: ReactNode; showSuccess: boolean }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden font-sans">
      <AuthBackground />
      <main className="relative z-10 w-full max-w-md rounded-3xl border border-white/30 bg-gradient-to-br from-white/95 via-white/85 to-white/95 p-6 sm:p-8 shadow-[0_22px_55px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-zinc-700/80 dark:bg-gradient-to-br dark:from-zinc-900/95 dark:via-zinc-950/95 dark:to-black/90 max-h-[90vh] overflow-auto">
        {children}
      </main>
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="pointer-events-none fixed inset-x-0 bottom-5 z-20 flex justify-center px-4"
        >
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-zinc-950/90 px-3 py-1.5 text-xs text-emerald-100 shadow-lg shadow-emerald-500/20 dark:bg-black/90">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px]">
              ✓
            </span>
            <span>Signed in successfully. Redirecting to your dashboard.</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSignUp = mode === "signup";
  const passwordAutoComplete = isSignUp ? "new-password" : "current-password";
  const passwordPlaceholder = isSignUp ? "Create a password" : "Enter your password";
  const submitLabel = isSignUp ? "Create account" : "Sign in";


  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json().catch(() => null)) as
          | { user?: { email: string; name?: string | null } | null }
          | null;

        if (!cancelled && data?.user) {
          setCurrentUser({
            email: data.user.email,
            name: data.user.name ?? null,
          });
        }
      } catch {
        // Best-effort only. If this fails, we just show the auth form.
      } finally {
        if (!cancelled) {
          setIsCheckingAuth(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Clear old errors
    setError(null);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);

    if (isSignUp && !name.trim()) {
      setNameError("Name is required");
      return;
    }

    if (!email) {
      setEmailError("Email is required");
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/signin";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name: isSignUp ? name : undefined }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !data.success) {
        const message = data.error || "Something went wrong. Please try again.";

        // Map common backend validation errors to field-level messages
        if (message.includes("Name is required")) {
          setNameError(message);
        } else if (
          message.includes("Please provide a valid email address") ||
          message.includes("account with this email already exists")
        ) {
          setEmailError(message);
        } else if (
          message.includes("Password must be at least 8 characters long") ||
          message.includes("Invalid email or password")
        ) {
          setPasswordError(message);
        } else if (message.includes("Email and password are required")) {
          setEmailError("Email is required");
          setPasswordError("Password is required");
        } else {
          setError(message);
        }

        return;
      }

      setShowSuccess(true);

      redirectTimeoutRef.current = setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayName = currentUser?.name?.trim() || currentUser?.email || "";

  const isAuthenticated = !!currentUser;

  if (isCheckingAuth) {
    return (
      <AuthLayout showSuccess={showSuccess}>
        <div className="space-y-6">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-5 w-32 animate-pulse rounded-full bg-zinc-200/70 dark:bg-zinc-800/80" />
            <div className="mx-auto h-3 w-52 animate-pulse rounded-full bg-zinc-200/60 dark:bg-zinc-800/70" />
          </div>
          <div className="space-y-3">
            <div className="h-9 animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80" />
            <div className="h-9 animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80" />
            <div className="h-9 animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80" />
            <div className="h-9 animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80" />
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (isAuthenticated) {
    return (
      <AuthLayout showSuccess={showSuccess}>
        <header className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            ✓
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              Welcome back, {displayName}
            </h1>
            <p className="mx-auto max-w-xs text-sm text-zinc-700 dark:text-zinc-300">
              You are already signed in. Pick up where you left off in your dashboard.
            </p>
          </div>
        </header>

        <motion.button
          type="button"
          onClick={() => router.push("/dashboard")}
          className={primaryButtonClasses}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.97, y: 0 }}
        >
          Go to dashboard
        </motion.button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout showSuccess={showSuccess}>
      <header className="mb-7 flex flex-col items-center gap-2 text-center">
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1 text-[11px] font-medium text-emerald-500 shadow-sm shadow-emerald-500/15">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.45)]" />
          <span>AI powered interview prep</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
          Interview Prep Coach
        </h1>
        <p className="mx-auto max-w-sm text-sm text-zinc-700 dark:text-zinc-300">
          Turn messy prep into focused, daily practice tailored to your next role.
        </p>
      </header>

      <div className="relative mb-6 flex rounded-full bg-zinc-900/5 p-1 text-sm font-medium text-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-300">
        <motion.div
          className="absolute inset-y-1 w-1/2 rounded-full bg-white shadow-sm shadow-zinc-900/10 dark:bg-zinc-950"
          initial={false}
          animate={{ x: isSignUp ? "0%" : "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setMode("signup")}
          className={`relative z-10 flex-1 rounded-full px-3 py-2 transition-colors ${
            isSignUp
              ? "text-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Sign up
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setMode("signin")}
          className={`relative z-10 flex-1 rounded-full px-3 py-2 transition-colors ${
            !isSignUp
              ? "text-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          Sign in
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {isSignUp && (
          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="w-full rounded-lg border border-zinc-200 bg-white/90 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-700 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {nameError && (
              <p className="mt-0.5 text-xs font-medium text-red-600 dark:text-red-400">{nameError}</p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-200 bg-white/90 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-700 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {emailError && (
            <p className="mt-0.5 text-xs font-medium text-red-600 dark:text-red-400">{emailError}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Password
            </label>
            {isSignUp && (
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                At least 8 characters, including a number.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={passwordAutoComplete}
              className="w-full rounded-lg border border-zinc-200 bg-white/90 px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-700 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
              placeholder={passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9.27-3.11-11-8 0-1.14.25-2.23.7-3.22" />
                  <path d="M6.1 6.1A9.84 9.84 0 0 1 12 4c5 0 9.27 3.11 11 8-.46 1.32-1.15 2.52-2.02 3.55" />
                  <path d="M9.88 9.88A3 3 0 0 1 14.12 14.12" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {passwordError && (
            <p className="mt-0.5 text-xs font-medium text-red-600 dark:text-red-400">{passwordError}</p>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting}
          className={primaryButtonClasses}
          whileHover={isSubmitting ? undefined : { scale: 1.01, y: -1 }}
          whileTap={isSubmitting ? undefined : { scale: 0.97, y: 0 }}
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
              <span>Working...</span>
            </span>
          ) : (
            submitLabel
          )}
        </motion.button>
      </form>

      {error && (
        <p className="mt-3 text-center text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        <div className="space-y-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {isSignUp && (
            <p>Already have an account? Use the Sign in tab above.</p>
          )}
          <p>By continuing, you agree to the Terms and Privacy Policy.</p>
        </div>

        {isSignUp && (
          <div className="rounded-2xl border border-zinc-200/80 bg-white/70 p-3 text-xs text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-200">
            <p className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">What you get</p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
                  ✓
                </span>
                <span>Daily question sets tuned to your role.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/10 text-[10px] text-sky-600 dark:text-sky-400">
                  ✓
                </span>
                <span>Structured feedback to close real gaps.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] text-indigo-600 dark:text-indigo-400">
                  ✓
                </span>
                <span>Lightweight mock interviews you can run any time.</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
