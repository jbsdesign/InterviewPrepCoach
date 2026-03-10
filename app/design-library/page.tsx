"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { BackArrowButton } from "@/app/dashboard/BackArrowButton";
import { SignOutButton } from "@/app/dashboard/SignOutButton";
import {
  OnboardingForm,
  type OnboardingInitialProfile,
} from "@/app/dashboard/OnboardingForm";
import { OnboardingWizard } from "@/app/dashboard/OnboardingWizard";
import {
  RolesSection,
  type RoleSummary,
  type UpcomingInterviewSummary,
} from "@/app/dashboard/RolesSection";

type ComponentId =
  | "home"
  | "onboardingWizard"
  | "onboardingForm"
  | "rolesSection"
  | "buttonsAndActions"
  | "inputsAndSelectors"
  | "dropdownMenus"
  | "togglesAndChips"
  | "motion"
  | "typography"
  | "colors"
  | "accessibility"
  | "architecture"
  | "userWorkflows";

type ComponentDoc = {
  id: ComponentId;
  name: string;
  shortDescription: string;
  technologies: string[];
  usageNotes: string[];
  render: () => JSX.Element;
  codeExample?: string;
};

type DesignSystemAgentMessage = {
  id: number;
  from: "agent" | "user";
  text: string;
};

function DesignLibraryBackground() {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,#0f172a,#020617_55%),radial-gradient(circle_at_100%_0%,#020617,#020617_55%),radial-gradient(circle_at_50%_120%,#020617,#020617_65%)]"
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-26%] rounded-[5rem] bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.6),transparent_55%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.55),transparent_60%),radial-gradient(circle_at_0%_100%,rgba(129,140,248,0.6),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(45,212,191,0.55),transparent_55%)] mix-blend-screen blur-2xl"
        initial={{ x: "-8%", y: "-6%", rotate: -8, scale: 0.96, opacity: 0.9 }}
        animate={{
          x: ["-8%", "10%", "4%", "-6%", "-8%"],
          y: ["-6%", "6%", "-2%", "4%", "-6%"],
          rotate: [-8, 6, -3, 4, -8],
          scale: [0.96, 1.05, 1.02, 1, 0.96],
          opacity: [0.85, 1, 0.9, 0.95, 0.85],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-40%] rounded-[7rem] bg-[conic-gradient(from_210deg_at_10%_0%,rgba(56,189,248,0.15),rgba(59,130,246,0.55),rgba(56,189,248,0.5),rgba(37,99,235,0.5),rgba(56,189,248,0.15))] mix-blend-screen blur-3xl"
        initial={{ x: "10%", y: "12%", rotate: 18, scale: 0.9, opacity: 0.8 }}
        animate={{
          x: ["10%", "-10%", "6%", "14%", "10%"],
          y: ["12%", "-8%", "10%", "18%", "12%"],
          rotate: [18, -14, 6, 14, 18],
          scale: [0.9, 1.08, 1.02, 0.96, 0.9],
          opacity: [0.8, 1, 0.9, 0.95, 0.8],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-[-10%] h-80 w-80 rounded-full bg-gradient-to-br from-emerald-400/70 via-cyan-400/60 to-sky-500/40 blur-3xl"
        initial={{ scale: 0.9, x: -10, y: 0 }}
        animate={{
          scale: [0.9, 1.26, 1.08, 0.98, 0.9],
          x: [-10, 8, -4, 4, -10],
          y: [0, 64, -32, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-[-14%] h-96 w-96 rounded-full bg-gradient-to-tr from-sky-500/65 via-blue-500/55 to-indigo-500/45 blur-3xl"
        initial={{ scale: 1.02, x: 10, y: 0 }}
        animate={{
          scale: [1.02, 0.92, 1.2, 1.04, 1.02],
          x: [10, -6, 4, 12, 10],
          y: [0, -82, 30, -40, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[-10%] inset-x-[-5%] bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.35),transparent_55%),radial-gradient(circle_at_80%_100%,rgba(59,130,246,0.35),transparent_55%)] opacity-60 mix-blend-screen"
        initial={{ x: 0, y: 0, opacity: 0.5 }}
        animate={{
          x: [0, 12, -8, 0],
          y: [0, -10, 6, 0],
          opacity: [0.5, 0.8, 0.6, 0.5],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

type PreviewTheme = "light" | "dark";

type ComponentPreviewProps = {
  render: () => JSX.Element;
};

function ComponentPreview({ render }: ComponentPreviewProps) {
  const [theme, setTheme] = useState<PreviewTheme>("light");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  function handleThemeChange(next: PreviewTheme) {
    setTheme(next);
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (next === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      // ignore storage errors
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-start gap-1.5 text-[11px]">
        <span className="mr-1 text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          View theme
        </span>
        <button
          type="button"
          onClick={() => handleThemeChange("light")}
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
            theme === "light"
              ? "border-zinc-900 bg-zinc-900 text-zinc-50 shadow-sm dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => handleThemeChange("dark")}
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
            theme === "dark"
              ? "border-zinc-900 bg-zinc-900 text-zinc-50 shadow-sm dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
        >
          Dark
        </button>
      </div>

      <div
        className={
          theme === "dark"
            ? "dark rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-4"
            : "rounded-xl bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-4"
        }
      >
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
          {render()}
        </div>
      </div>
    </div>
  );
}

type CodeExampleProps = {
  code?: string;
};

function CodeExample({ code }: CodeExampleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayCode =
    code ?? "// Code example coming soon. Add a codeExample string to this entry in COMPONENT_DOCS.\n";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-zinc-900 hover:text-zinc-950 dark:text-zinc-50 dark:hover:text-zinc-100"
      >
        <span>See code</span>
        <span className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          {copied && <span className="text-emerald-500">Copied</span>}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4"
          >
            <path
              d="M9 3.75h9.25v12.5H9z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.75 7.25v13h9.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3"
          >
            <div className="relative">
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-2 top-2 inline-flex h-7 items-center justify-center rounded-md bg-zinc-800 px-2 text-[11px] font-medium text-zinc-50 shadow hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="mr-1.5 h-3.5 w-3.5"
                >
                  <path
                    d="M9 3.75h9.25v12.5H9z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.75 7.25v13h9.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copy
              </button>
              <pre className="overflow-x-auto rounded-md bg-zinc-950/95 p-3 text-[11px] leading-relaxed text-zinc-100">
                <code>{displayCode}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const sampleProfile: OnboardingInitialProfile = {
  fullName: "Alex Candidate",
  headline: "Senior product manager focused on B2B SaaS",
  currentRole: "Senior Product Manager",
  company: "Acme Corp",
  yearsExperience: "8",
  location: "San Francisco, CA",
  summary:
    "Experienced PM with a background in user research, experimentation, and cross functional leadership.",
  extraContext:
    "Used in onboarding when a user chooses to enter profile details manually instead of uploading a resume.",
};

const sampleRoles: RoleSummary[] = [
  {
    id: "sample-role-1",
    title: "Senior Product Manager",
    company: "Acme Corp",
    level: "L6",
    description:
      "Product leadership role focused on interview preparation tooling and candidate experience.",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sample-role-2",
    title: "Staff Software Engineer",
    company: "Beta Systems",
    level: "Staff",
    description: "Partner role for core platform, used to illustrate multiple cards.",
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

const sampleUpcoming: UpcomingInterviewSummary[] = [
  {
    id: "sample-interview-1",
    roleId: "sample-role-1",
    roleTitle: "Senior Product Manager",
    company: "Acme Corp",
    interviewerType: "Hiring Manager",
    interviewerName: "Jamie Lee",
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    notes:
      "Focus on product sense, roadmap tradeoffs, and how you lead cross functional teams.",
  },
];

function ThemeToggleDemo() {
  const [isDarkView, setIsDarkView] = useState(false);

  const label = isDarkView ? "Dark view" : "Light view";

  return (
    <button
      type="button"
      onClick={() => setIsDarkView((prev) => !prev)}
      className="flex w-full max-w-xs items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] font-medium text-zinc-800 dark:text-zinc-100"
    >
      <span>{label}</span>
      <span
        className={`relative inline-flex h-4 w-7 items-center rounded-full border transition-colors ${
          isDarkView
            ? "border-zinc-300 bg-zinc-200"
            : "border-zinc-600 bg-zinc-800"
        }`}
      >
        <span
          className={`h-3 w-3 rounded-full bg-white shadow transition-transform ${
            isDarkView ? "translate-x-0.5" : "translate-x-3"
          }`}
        />
      </span>
    </button>
  );
}

function MotionCardsDemo() {
  const [count, setCount] = useState(2);

  const cards = Array.from({ length: count }, (_, index) => index);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCount((current) => Math.min(4, current + 1))}
          className="rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add card
        </button>
        <button
          type="button"
          onClick={() => setCount((current) => Math.max(1, current - 1))}
          disabled={count <= 1}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Remove card
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {cards.map((id) => (
          <motion.div
            key={id}
            layout
            initial={{ opacity: 0.4, y: 4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="space-y-1 rounded-lg border border-zinc-200 bg-white p-3 text-[11px] shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              Role card {id + 1}
            </p>
            <p className="text-zinc-600 dark:text-zinc-300">
              Cards slide and resize instead of jumping when you change the set.
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MotionOverlayDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-500"
      >
        Open panel
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-2 rounded-xl border border-zinc-200 bg-white p-3 text-[11px] shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Floating panel
                </p>
                <p className="text-zinc-600 dark:text-zinc-300">
                  This mimics how menus and dialogs fade and scale in on top of the
                  main page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PracticeAiMotionDemo() {
  const [isStarted, setIsStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const baseTileScale = isStarted ? 1.35 : 1;
  const speakingBoost = isSpeaking ? (isStarted ? 0.12 : 0.06) : 0;
  const tileScale = baseTileScale + speakingBoost;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={() => {
            setIsStarted((prev) => !prev);
            if (isSpeaking && isStarted) {
              setIsSpeaking(false);
            }
          }}
          className="rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-blue-600/40 transition hover:bg-blue-500"
        >
          {isStarted ? "Pause interview" : "Start interview"}
        </button>
        <button
          type="button"
          onClick={() => setIsSpeaking((prev) => !prev)}
          disabled={!isStarted}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          {isSpeaking ? "Stop speaking animation" : "Simulate speaking"}
        </button>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          This mirrors how the AI tile grows when a session starts and pulses while
          it is talking.
        </p>
      </div>

      <div
        className="relative mt-1 h-40 overflow-hidden rounded-xl transition-colors duration-700"
        style={{
          background: isStarted
            ? "linear-gradient(135deg,#7dd3fc 0%,#38bdf8 40%,#4f46e5 100%)"
            : "#020617",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative flex items-center justify-center rounded-[32px] border border-white/70 shadow-[0_0_40px_rgba(56,189,248,0.8)] backdrop-blur-md transition-transform duration-500"
            style={{
              width: 140,
              height: 100,
              background:
                isStarted && isSpeaking
                  ? "linear-gradient(135deg,#e0f2fe 0%,#7dd3fc 35%,#38bdf8 70%)"
                  : isStarted
                    ? "linear-gradient(135deg,#7dd3fc 0%,#38bdf8 40%,#4f46e5 100%)"
                    : "linear-gradient(135deg,#020617 0%,#111827 100%)",
              transform: `scale(${tileScale})`,
              transformOrigin: "center center",
              borderRadius: 32,
              border: isSpeaking
                ? "1px solid rgba(255,255,255,0.9)"
                : "1px solid rgba(255,255,255,0.65)",
              boxShadow: isSpeaking
                ? "0 0 18px rgba(56,189,248,0.6)"
                : isStarted
                  ? "0 0 8px rgba(15,23,42,0.7)"
                  : "0 0 4px rgba(15,23,42,0.6)",
            }}
          >
            {isSpeaking && (
              <div
                className="pointer-events-none absolute inset-[-6px] ai-glow-pulse"
                style={{
                  borderRadius: 34,
                  background:
                    "radial-gradient(circle, rgba(224,242,254,0.8) 0%, rgba(125,211,252,0.6) 40%, transparent 80%)",
                }}
              />
            )}

            <div
              className="pointer-events-none absolute inset-[1px] rounded-[30px]"
              style={{
                background: isStarted
                  ? "linear-gradient(135deg,rgba(255,255,255,0.7) 0%,rgba(255,255,255,0.25) 40%,transparent 100%)"
                  : "linear-gradient(135deg,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0.12) 40%,transparent 100%)",
                borderRadius: 30,
              }}
            />

            {isSpeaking && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 flex h-6 -translate-x-1/2 items-end gap-[3px]">
                <span className="ai-wave-bar ai-wave-bar-1" />
                <span className="ai-wave-bar ai-wave-bar-2" />
                <span className="ai-wave-bar ai-wave-bar-3" />
                <span className="ai-wave-bar ai-wave-bar-4" />
              </div>
            )}

            <span className="relative text-3xl font-semibold text-white drop-shadow-[0_4px_12px_rgba(15,23,42,0.65)]">
              AI
            </span>
          </div>
        </div>

        <div className="absolute bottom-3 inset-x-0 flex justify-center">
          <div className="rounded-full bg-black/40 px-3 py-1 text-[10px] font-medium text-zinc-100">
            Interviewer
          </div>
        </div>
      </div>
    </div>
  );
}

type DesignSystemAgentChatProps = {
  isHome: boolean;
};

function DesignSystemAgentChat({ isHome }: DesignSystemAgentChatProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(isHome);
  const [hasUserOverride, setHasUserOverride] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<DesignSystemAgentMessage[]>([]);

  const hasStarted = messages.length > 1;
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasUserOverride) {
      setIsExpanded(isHome);
    }
  }, [isHome, hasUserOverride]);

  useEffect(() => {
    if (isExpanded && hasStarted && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isExpanded, hasStarted]);

  function handleToggleExpand() {
    setIsExpanded((previous) => !previous);
    setHasUserOverride(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setInput("");
    setIsExpanded(true);
    setHasUserOverride(true);

    setMessages((previous) => {
      const nextMessages: DesignSystemAgentMessage[] = [
        ...previous,
        { id: previous.length + 1, from: "user", text: trimmed },
      ];

      void callDesignSystemAgent(nextMessages);
      return nextMessages;
    });
  }

  async function callDesignSystemAgent(
    history: DesignSystemAgentMessage[],
  ): Promise<void> {
    try {
      const response = await fetch("/api/design-system-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((message) => ({
            role: message.from,
            text: message.text,
          })),
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        reply?: string;
        error?: string;
      };

      if (!response.ok || !data.success || !data.reply) {
        setMessages((previous) => [
          ...previous,
          {
            id: previous.length + 1,
            from: "agent",
            text:
              data.error ||
              "The design system agent was unable to respond. Please try again.",
          },
        ]);
        return;
      }

      setMessages((previous) => [
        ...previous,
        {
          id: previous.length + 1,
          from: "agent",
          text: data.reply!,
        },
      ]);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          id: previous.length + 1,
          from: "agent",
          text:
            "There was a problem talking to the design system agent. Please try again.",
        },
      ]);
    }
  }

  return (
    <div className="sticky top-0 z-20">
      <section className="w-full border-b border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-2">
          <div className="flex items-center gap-3 text-[13px]">
            <button
              type="button"
              onClick={handleToggleExpand}
              className="inline-flex h-6 w-6 items-center justify-center text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
              aria-label={isExpanded ? "Collapse design system agent" : "Expand design system agent"}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
              >
                <path
                  d={isExpanded ? "M4 10l4-4 4 4" : "M4 6l4 4 4-4"}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="flex items-center gap-2 text-[12px] font-medium">
              <span className="uppercase tracking-wide text-[11px] text-zinc-700 dark:text-zinc-300">
                Design system agent
              </span>
            </div>

            {!isExpanded && (
              <form
                onSubmit={handleSubmit}
                className="ml-2 flex flex-1 items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask a question about this system"
                  className="w-full rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 outline-none ring-0 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-sky-400 dark:focus:ring-sky-500/40"
                />
                <button
                  type="submit"
                  className="rounded-full bg-[linear-gradient(to_right,#3b587a,#4f6f92)] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.4)] dark:bg-[linear-gradient(to_right,#020617,#111827)] dark:ring-zinc-700"
                >
                  Ask
                </button>
              </form>
            )}
          </div>

          {isExpanded && hasStarted && (
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-900">
              {messages
                .filter((message) => message.from === "agent")
                .map((message) => (
                  <div key={message.id} className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-zinc-800 px-3 py-2 leading-snug text-zinc-50 shadow-sm">
                      {message.text}
                    </div>
                  </div>
                ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {isExpanded && (
            <form
              onSubmit={handleSubmit}
              className="mt-2 flex items-center gap-2 text-[13px]"
            >
              <div className="flex flex-1 items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask a question about this system"
                  className="w-full rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-[13px] text-zinc-900 placeholder:text-zinc-400 outline-none ring-0 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-sky-400 dark:focus:ring-sky-500/40"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-[linear-gradient(to_right,#3b587a,#4f6f92)] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.4)] dark:bg-[linear-gradient(to_right,#020617,#111827)] dark:ring-zinc-700"
              >
                Ask
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

const COMPONENT_DOCS: ComponentDoc[] = [
  {
    id: "home",
    name: "Home",
    shortDescription: "Start here to see an overview and ask questions.",
    technologies: ["Framer Motion", "Tailwind CSS"],
    usageNotes: [
      "Use this surface to ask questions about components, motion, colors, and flows.",
      "Pairs the design system agent with a high level summary of the app.",
    ],
    render: () => (
      <div className="space-y-8 px-1 py-2 sm:px-2 sm:py-4">
        <section className="rounded-3xl border border-zinc-200/30 bg-black/45 px-6 py-9 text-center text-zinc-50 shadow-[0_20px_55px_rgba(15,23,42,0.65)] ring-1 ring-white/10 backdrop-blur-2xl dark:border-zinc-800/50 sm:px-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              Interview Prep Coach<br />
              <span className="text-zinc-200">Design library</span>
            </h1>
            <p className="max-w-2xl text-lg text-zinc-200/90">
              Explore the building blocks of the product: buttons, forms, motion,
              typography, colors, and flows used in Interview Prep Coach.
            </p>
          </div>
        </section>

        <section className="space-y-5 text-left text-sm text-zinc-100">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-white/15 bg-black/60 px-6 py-7 shadow-[0_16px_48px_rgba(15,23,42,0.75)] backdrop-blur-3xl">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
                About this design system
              </h2>
              <p className="text-sm md:text-base leading-relaxed text-zinc-200/90">
                The design library gathers the real components used in Interview Prep
                Coach so you can reason about changes in one place: buttons, inputs,
                motion, typography, and colors.
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-200/90">
                <li>Reference visual patterns while exploring new ideas and wireframes.</li>
                <li>Spot inconsistencies before they ship to production.</li>
                <li>Share a common language between design, product, and engineering.</li>
              </ul>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/15 bg-black/60 px-6 py-7 shadow-[0_16px_48px_rgba(15,23,42,0.75)] backdrop-blur-3xl">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-50">
                About the app
              </h2>
              <p className="text-sm md:text-base leading-relaxed text-zinc-200/90">
                Interview Prep Coach is a focused practice environment for real
                interviews, built on Next.js App Router with a Prisma backed data layer.
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-200/90">
                <li>UI screens live under <code className="font-mono">/app</code> and are composed from these components.</li>
                <li>API routes in <code className="font-mono">/app/api</code> power auth, profiles, roles, and sessions.</li>
                <li>Prisma models capture roles, interviews, notes, and practice history.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    ),
  },
  {
    id: "onboardingWizard",
    name: "Onboarding wizard",
    shortDescription:
      "Multi step onboarding flow that supports both resume upload and manual entry of profile details.",
    technologies: [
      "React client component",
      "Next.js router",
      "File uploads",
      "Tailwind CSS",
    ],
    usageNotes: [
      "Rendered on the dashboard when a user has signed in but has not created a profile yet.",
      "Starts in a choice state and transitions to manual form or supporting materials after a resume upload.",
    ],
    render: () => (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <OnboardingWizard initialName="Alex Candidate" />
      </div>
    ),
    codeExample: `import { OnboardingWizard } from "@/app/dashboard/OnboardingWizard";

export function OnboardingWizardExample() {
  return <OnboardingWizard initialName="Alex Candidate" />;
}
`,
  },
  {
    id: "onboardingForm",
    name: "Onboarding form",
    shortDescription:
      "Single page form used inside the onboarding wizard when a user chooses manual entry.",
    technologies: ["React client component", "App Router API routes", "Tailwind CSS"],
    usageNotes: [
      "Accepts an initial profile object so the form can be pre filled when coming from uploaded resume metadata.",
      "Saves data to /api/profile and then refreshes the dashboard.",
    ],
    render: () => (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <OnboardingForm initial={sampleProfile} />
      </div>
    ),
    codeExample: `import { OnboardingForm } from "@/app/dashboard/OnboardingForm";

const sampleProfile = {
  fullName: "Alex Candidate",
  headline: "Senior product manager focused on B2B SaaS",
  currentRole: "Senior Product Manager",
  company: "Acme Corp",
};

export function OnboardingFormExample() {
  return <OnboardingForm initial={sampleProfile} />;
}
`,
  },
  {
    id: "rolesSection",
    name: "Roles section",
    shortDescription:
      "Dashboard section that manages roles, interviews, and upcoming practice sessions in a single surface.",
    technologies: [
      "React client component",
      "Next.js App Router",
      "Framer Motion animations",
      "App Router API routes",
      "Tailwind CSS",
    ],
    usageNotes: [
      "Rendered on the main dashboard after onboarding has been completed.",
      "Requires initial roles and upcoming interviews data from the server, but can hydrate additional interview details on mount.",
    ],
    render: () => (
      <RolesSection
        initialRoles={sampleRoles}
        initialUpcomingInterviews={sampleUpcoming}
      />
    ),
    codeExample: `import { RolesSection } from "@/app/dashboard/RolesSection";

export function RolesSectionExample({ roles, upcoming }) {
  return (
    <RolesSection
      initialRoles={roles}
      initialUpcomingInterviews={upcoming}
    />
  );
}
`,
  },
  {
    id: "buttonsAndActions",
    name: "Buttons and actions",
    shortDescription:
      "Primary, secondary, shell, and destructive buttons used across Interview Prep Coach.",
    technologies: ["React components", "Tailwind CSS", "HTML buttons"],
    usageNotes: [
      "Primary actions use a steel blue gradient background with white text and a soft shadow.",
      "Shell buttons such as sign in, sign out, and back use more compact or circular shapes.",
      "Destructive actions use red text or backgrounds and are often icon-only in dense UIs.",
    ],
    render: () => (
      <div className="space-y-6">
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          These button styles appear on forms, cards, and dialogs. They are composed
          directly with Tailwind utility classes and a few small components.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              Primary button (sign in / submit)
            </p>
            <button
              type="button"
              className="rounded-full bg-[linear-gradient(to_right,#3b587a,#4f6f92)] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(15,23,42,0.3)] ring-1 ring-slate-200/70 transition transform hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(15,23,42,0.4)] dark:bg-[linear-gradient(to_right,#020617,#111827)] dark:ring-zinc-700"
            >
              Sign in to dashboard
            </button>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Used for main actions such as signing in, saving a role, or advancing a
              flow.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              Secondary button
            </p>
            <button
              type="button"
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Appears alongside primary actions to offer safe alternatives.
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              Shell buttons (back and sign out)
            </p>
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
              <BackArrowButton />
              <div className="space-y-1 text-xs">
                <p className="font-medium text-zinc-800 dark:text-zinc-100">
                  Back arrow button
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Used at the top of detail pages to return to the previous screen.
                </p>
              </div>
            </div>
            <div className="mt-2 space-y-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
              <SignOutButton />
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Live sign out action used in menus and profile. Clicking it will end the
                current session.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Destructive icon button
              </p>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5"
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
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Used for delete actions on roles, interviews, and documents.
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                Pill buttons
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full bg-[linear-gradient(to_right,#3b587a,#4f6f92)] px-3 py-1 text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.4)] dark:bg-[linear-gradient(to_right,#020617,#111827)] dark:ring-zinc-700"
                >
                  Start interview
                </button>
                <button
                  type="button"
                  className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Exit
                </button>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Capsule shaped buttons used in the practice interview header.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
    codeExample: `import { BackArrowButton } from "@/app/dashboard/BackArrowButton";
import { SignOutButton } from "@/app/dashboard/SignOutButton";

export function ButtonsExample() {
  return (
    <div className="space-y-4">
      <button
        type="button"
        className="rounded-full bg-[linear-gradient(to_right,#3b587a,#4f6f92)] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_18px_rgba(15,23,42,0.3)] ring-1 ring-slate-200/70"
      >
        Sign in to dashboard
      </button>

      <button
        type="button"
        className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800"
      >
        Cancel
      </button>

      <div className="flex items-center gap-3">
        <BackArrowButton />
        <SignOutButton />
      </div>
    </div>
  );
}
`,
  },
  {
    id: "inputsAndSelectors",
    name: "Inputs and selectors",
    shortDescription:
      "Text fields, textareas, selects, date, and time inputs used in onboarding and role flows.",
    technologies: ["HTML inputs", "Tailwind CSS"],
    usageNotes: [
      "Inputs share a consistent rounded border, shadow, and focus ring treatment.",
      "Selectors and date/time inputs reuse the same visual language to feel cohesive.",
      "Error text is displayed in red-600 / red-400 underneath the control.",
    ],
    render: () => (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Text input
            </label>
            <input
              type="text"
              placeholder="Senior Product Manager"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Textarea
            </label>
            <textarea
              rows={3}
              placeholder="Paste a short role description or summary."
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-900"
            />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Select (interviewer role)
            </label>
            <select
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              defaultValue=""
            >
              <option value="" disabled>
                Select a role
              </option>
              <option>Hiring Manager</option>
              <option>Product Manager</option>
              <option>Designer</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Date input
            </label>
            <input
              type="date"
              className="w-full rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Time input
            </label>
            <input
              type="time"
              className="w-full rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            />
          </div>
        </div>
      </div>
    ),
    codeExample: `export function InputsExample() {
  return (
    <form className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-800">
          Role title
        </label>
        <input
          type="text"
          placeholder="Senior Product Manager"
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-800">
          Interviewer role
        </label>
        <select
          className="mt-1 w-full rounded-md border border-zinc-300 px-2 py-1 text-[11px]"
          defaultValue=""
        >
          <option value="" disabled>
            Select a role
          </option>
          <option>Hiring Manager</option>
          <option>Product Manager</option>
        </select>
      </div>
    </form>
  );
}
`,
  },


  {
    id: "dropdownMenus",
    name: "Dropdown menus",
    shortDescription:
      "Select menus used for roles, statuses, and voice selection across the app.",
    technologies: ["HTML select", "Tailwind CSS"],
    usageNotes: [
      "Use selects when there are a small number of clear, discrete options.",
      "Mirror the same select treatment for role metadata, prep statuses, and settings.",
    ],
    render: () => (
      <div className="space-y-4">
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Dropdown menus appear in forms and settings for interviewer roles, prep item
          status, and voice selection.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Interviewer role
            </label>
            <select
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              defaultValue=""
            >
              <option value="" disabled>
                Select a role
              </option>
              <option>Hiring Manager</option>
              <option>Product Manager</option>
              <option>Recruiter</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Prep item status
            </label>
            <select
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              defaultValue="not_started"
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Voice (Safari)
            </label>
            <select className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800">
              <option>Default voice</option>
              <option>Allison</option>
              <option>Alex</option>
            </select>
          </div>
        </div>
      </div>
    ),
    codeExample: `export function DropdownMenusExample() {
  return (
    <div className="space-y-3">
      <select className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[11px]">
        <option value="" disabled>Select a role</option>
        <option>Hiring Manager</option>
        <option>Product Manager</option>
      </select>
      <select className="w-full rounded-md border border-zinc-300 px-2 py-1 text-[11px]">
        <option value="not_started">Not started</option>
        <option value="in_progress">In progress</option>
        <option value="done">Done</option>
      </select>
    </div>
  );
}
`,
  },
  {
    id: "togglesAndChips",
    name: "Toggles and chips",
    shortDescription:
      "Theme toggle and pill chips used to represent state or filters.",
    technologies: ["Tailwind CSS", "Client components"],
    usageNotes: [
      "The profile menu includes a theme toggle implemented as a small pill switch.",
      "Chips are used for subtle emphasis of metadata like interview type or status.",
    ],
    render: () => (
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Theme toggle
          </p>
          <ThemeToggleDemo />
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            A compact pill switch used inside the user menu to flip between light and
            dark layouts.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Status chips
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700">
              Upcoming interview
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800">
              Feedback saved
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Small rounded chips emphasize important metadata without overwhelming the
            primary content.
          </p>
        </div>
      </div>
    ),
    codeExample: `import { useState } from "react";

export function ThemeToggleChip() {
  const [isDark, setIsDark] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setIsDark(!isDark)}
      className="flex items-center justify-between rounded-full border border-zinc-300 bg-white px-2 py-1 text-[11px]"
    >
      <span>{isDark ? "Dark view" : "Light view"}</span>
      <span className="relative inline-flex h-4 w-7 items-center rounded-full bg-zinc-900">
        <span className="h-3 w-3 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}
`,
  },
  {
    id: "motion",
    name: "Motion and animation",
    shortDescription:
      "How motion is used to guide focus, explain layout changes, and make the UI feel alive.",
    technologies: ["Framer Motion", "CSS transitions"],
    usageNotes: [
      "Layout animations smooth card reflow when roles are created or removed.",
      "Overlay and modal transitions are used for interview details and notes panels.",
      "Subtle hover and background motion help indicate important call to action areas without being distracting.",
    ],
    render: () => (
      <div className="space-y-4">
        <p className="text-sm text-zinc-700 dark:text-zinc-200">
          Interview Prep Coach uses motion primarily as a communication tool rather than
          decoration. Animations make changes feel intentional and help you understand
          where new information is coming from.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              Card layout transitions
            </p>
            <MotionCardsDemo />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              Overlay and menu motion
            </p>
            <MotionOverlayDemo />
          </div>
          <div className="space-y-2 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
              Practice interview AI tile
            </p>
            <PracticeAiMotionDemo />
          </div>
        </div>
      </div>
    ),
    codeExample: `import { motion } from "framer-motion";

export function MotionExample() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0.4, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="rounded-lg border border-zinc-200 bg-white p-3 text-sm"
    >
      Cards slide and resize instead of jumping when you change the set.
    </motion.div>
  );
}
`,
  },
  {
    id: "typography",
    name: "Typography",
    shortDescription:
      "Font ramp and guidelines for headings, body, and supporting text.",
    technologies: ["Geist Sans", "Geist Mono", "Tailwind CSS"],
    usageNotes: [
      "Use larger, tighter tracked headings for page titles and entry points.",
      "Use text-base or text-sm for primary body copy to keep content readable.",
      "Use smaller sizes with increased letter spacing for labels and metadata.",
    ],
    render: () => (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Font stack
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-200">
            Interview Prep Coach uses Geist Sans for UI and Geist Mono for code or
            structured tokens. All typography is set on the <code className="font-mono text-[11px]">html</code> tag
            so that components stay consistent across pages.
          </p>
        </div>
        <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
          <p>
            <span className="font-semibold">Geist Sans</span> · system like <code className="font-mono text-[11px]">-apple-system</code>
            · used for headings, body, and labels.
          </p>
          <p>
            <span className="font-semibold">Geist Mono</span> · monospaced · used for code and API paths.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Display heading
              </p>
              <p className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Interview Prep Coach
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                30px · <span className="font-mono">font-semibold</span> · use for page level titles such as dashboard
                and profile.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Section heading
              </p>
              <p className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                Upcoming interviews
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                20px · <span className="font-mono">font-semibold</span> · use for primary blocks such as roles,
                prep plan, or documents.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Body text
              </p>
              <p className="text-sm text-zinc-800 dark:text-zinc-200">
                14px · <span className="font-mono">font-normal</span> · default size for descriptions, helper copy,
                and explanatory text.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Caption and label
              </p>
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                12px · <span className="font-mono">font-medium</span> · used for labels, field hints, and timestamps.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Mono text
              </p>
              <p className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200">
                <span className="font-mono text-[11px]">POST /api/practice-interview</span>
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                11px · <span className="font-mono">font-mono</span> · used for inline code, API paths, and tokens.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Link text
              </p>
              <p className="text-sm text-blue-600 underline underline-offset-2 dark:text-blue-400">
                14px · <span className="font-mono">font-medium</span> · interactive text links such as “View
                feedback history”.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
    codeExample: `export function TypographyExample() {
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-semibold tracking-tight">
        Interview Prep Coach
      </h1>
      <h2 className="text-xl font-semibold">Upcoming interviews</h2>
      <p className="text-sm text-zinc-700">
        This is the default body size for descriptions and helper copy.
      </p>
      <p className="text-xs text-zinc-500">
        Smaller text is used for labels and metadata.
      </p>
      <p className="font-mono text-[11px] text-zinc-800">
        POST /api/practice-interview
      </p>
    </section>
  );
}
`,
  },
  {
    id: "colors",
    name: "Colors",
    shortDescription:
      "Core color palette for backgrounds, surfaces, accents, and feedback states.",
    technologies: ["Tailwind CSS", "Zinc grayscale", "Brand accents"],
    usageNotes: [
      "Use zinc grays for most backgrounds and surfaces in both light and dark modes.",
      "Use blue for primary CTAs and interactive affordances (like Start interview).",
      "Use red and emerald only for feedback and status (errors vs success).",
    ],
    render: () => (
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Brand accents
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <div className="h-16 rounded-xl bg-blue-600 shadow-sm ring-1 ring-blue-400/60" />
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                Primary action
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Buttons like Start interview and key CTAs.
              </p>
            </div>
            <div className="space-y-1">
              <div className="h-16 rounded-xl bg-emerald-500 shadow-sm ring-1 ring-emerald-300/70" />
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                Success
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Used for confirmations, success toasts, and checkmarks.
              </p>
            </div>
            <div className="space-y-1">
              <div className="h-16 rounded-xl bg-red-500 shadow-sm ring-1 ring-red-300/70" />
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                Error
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Validation errors and destructive actions.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
            Surfaces and backgrounds
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <div className="h-16 rounded-xl bg-zinc-50 ring-1 ring-zinc-200" />
              <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50">
                Light surface
              </p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Cards and panels in light mode.
              </p>
            </div>
            <div className="space-y-1">
              <div className="h-16 rounded-xl bg-zinc-900 ring-1 ring-zinc-700" />
              <p className="text-xs font-medium text-zinc-50">
                Dark surface
              </p>
              <p className="text-[11px] text-zinc-400">
                Cards and panels in dark mode.
              </p>
            </div>
            <div className="space-y-1">
              <div className="relative h-16 overflow-hidden rounded-xl ring-1 ring-sky-300/70 bg-[#020617]">
                <DesignLibraryBackground />
              </div>
              <p className="text-xs font-medium text-zinc-50">
                Aurora background
              </p>
              <p className="text-[11px] text-zinc-400">
                Used for immersive hero moments such as the landing page and design
                library home.
              </p>
            </div>
            <div className="space-y-1">
              <div className="h-16 rounded-xl bg-black ring-1 ring-zinc-800" />
              <p className="text-xs font-medium text-zinc-50">
                Canvas
              </p>
              <p className="text-[11px] text-zinc-400">
                Base behind full-bleed gradients or when content recedes.
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
    codeExample: `export function ColorsExample() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <div className="h-10 rounded-lg bg-blue-600" />
        <p className="text-xs font-medium">Primary action</p>
      </div>
      <div className="space-y-1">
        <div className="h-10 rounded-lg bg-emerald-500" />
        <p className="text-xs font-medium">Success</p>
      </div>
      <div className="space-y-1">
        <div className="h-10 rounded-lg bg-red-500" />
        <p className="text-xs font-medium">Error</p>
      </div>
    </div>
  );
}
`,
  },

  {
    id: "accessibility",
    name: "Accessibility",
    shortDescription:
      "Guidelines and patterns that make Interview Prep Coach usable for everyone.",
    technologies: ["ARIA", "Semantic HTML", "Keyboard navigation"],
    usageNotes: [
      "Every interactive element should be reachable and operable via keyboard only.",
      "Use semantic HTML and ARIA roles to communicate structure to assistive tech.",
      "Test key workflows (sign in, start interview, submit feedback) with screen readers.",
    ],
    render: () => (
      <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
        <p>
          Accessibility is a core requirement, not an add on. The goal is for every
          candidate to be able to prepare for interviews comfortably, regardless of
          ability, device, or context.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Perceivable
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Maintain at least WCAG AA color contrast for text and key UI elements.</li>
              <li>Never rely on color alone to convey meaning; pair color with icons or text.</li>
              <li>Ensure labels are programmatically associated with inputs via <code className="font-mono">&lt;label htmlFor&gt;</code>.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
              Operable
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>All controls (buttons, links, toggles) must be reachable and usable via keyboard.</li>
              <li>Use visible focus rings on interactive elements; do not remove the outline without replacement.</li>
              <li>Ensure dialogs and overlays trap focus and return focus when closed.</li>
            </ul>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Understandable and robust
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Use clear, concise language, especially in error messages, helper text, and
              AI generated guidance.
            </li>
            <li>Respect user preferences such as reduced motion and prefers reduced transparency.</li>
            <li>
              Test with screen readers (VoiceOver, NVDA) and keyboard only flows when
              making significant UI changes.
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "architecture",
    name: "Architecture",
    shortDescription:
      "High level view of how the web app, API routes, and data layer fit together.",
    technologies: ["Next.js App Router", "API routes", "Prisma", "Database"],
    usageNotes: [
      "Helps new contributors orient themselves before making backend or routing changes.",
      "Makes it clear which concerns live in the UI, API routes, and persistence layers.",
    ],
    render: () => (
      <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-200">
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            UX architecture
          </p>
          <div className="space-y-4 text-xs md:text-sm">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Entry and auth
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm">
                <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                  Landing page
                </span>
                <span className="text-base text-zinc-400">→</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                  Auth shell (sign up / sign in)
                </span>
                <span className="text-base text-zinc-400">→</span>
                <span className="rounded-full bg-blue-600 px-3 py-1.5 text-zinc-50">
                  Dashboard home
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Onboarding and profile
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm">
                <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                  First time dashboard
                </span>
                <span className="text-base text-zinc-400">→</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                  Onboarding wizard
                </span>
                <span className="text-base text-zinc-400">→</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                  Supporting docs
                </span>
                <span className="text-base text-zinc-400">→</span>
                <span className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-zinc-50">
                  Profile complete
                </span>
                <span className="text-base text-zinc-400">→</span>
                <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                  Roles dashboard
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Practice loop
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm">
                <span className="rounded-full bg-zinc-900 px-3 py-1.5 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                  Role detail
                </span>
                <span className="text-base text-zinc-400">→</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                  Select interview
                </span>
                <span className="text-base text-zinc-400">→</span>
                <span className="rounded-full bg-blue-600 px-3 py-1.5 text-zinc-50">
                  Practice workspace
                </span>
                <span className="text-base text-zinc-400">→</span>
                <span className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-zinc-50">
                  Feedback and notes
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Design library
              </p>
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm">
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                  Design library
                </span>
                <span className="text-base text-zinc-400">·</span>
                <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
                  Components, motion, colors, workflows
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Technical architecture
          </p>
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
            {/* Main stack diagram */}
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Web stack
              </p>
              <div className="space-y-2 text-xs">
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="font-semibold">Browser</p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    React components rendered via Next.js App Router under
                    <code className="ml-1 font-mono">/app</code>.
                  </p>
                </div>
                <div className="flex items-center justify-center text-zinc-400">
                  <span className="text-lg">↓</span>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="font-semibold">Next.js API routes</p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Request handlers in <code className="font-mono">/app/api</code> handle auth, profile, roles,
                    interviews, and practice sessions.
                  </p>
                </div>
                <div className="flex items-center justify-center text-zinc-400">
                  <span className="text-lg">↓</span>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="font-semibold">Prisma + database</p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Stores users, profiles, roles, interviews, and prep items.
                  </p>
                </div>
                <div className="flex items-center justify-center text-zinc-400">
                  <span className="text-lg">↓</span>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="font-semibold">Uploads storage</p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Local filesystem uploads for resumes and supporting documents under
                    <code className="ml-1 font-mono">/uploads</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Supporting notes */}
            <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                Responsibilities
              </p>
              <ul className="list-disc space-y-1 pl-4 text-zinc-700 dark:text-zinc-300">
                <li>UI components focus on presentation and local interaction state.</li>
                <li>API routes encapsulate business logic, validation, and persistence.</li>
                <li>Prisma models capture domain concepts like roles and interviews.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "userWorkflows",
    name: "User workflows",
    shortDescription:
      "Common paths users take through authentication, onboarding, and role management.",
    technologies: ["User journey diagrams"],
    usageNotes: [
      "Helps designers and engineers understand typical flows before changing UI copy or routing.",
      "Useful as a checklist when adding new features that touch auth or roles.",
    ],
    render: () => (
      <div className="space-y-6 text-sm text-zinc-700 dark:text-zinc-200">
        {/* Auth flow */}
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Authentication
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
              Landing page
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
              Sign up / Sign in form
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-emerald-500/90 px-4 py-1.5 text-zinc-50">
              Session created
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
              Dashboard
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Returning users skip the form and go directly from the landing page to the
            dashboard if a valid session exists.
          </p>
        </div>

        {/* Onboarding flow */}
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Onboarding
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
              First time dashboard view
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
              Onboarding wizard (upload resume or manual form)
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
              Optional supporting documents
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-emerald-500/90 px-4 py-1.5 text-zinc-50">
              Profile saved
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
              Roles view
            </span>
          </div>
        </div>

        {/* Roles and interviews flow */}
        <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Roles and interviews
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
              Dashboard roles section
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
              Create role
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
              Add interviews
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-blue-600 px-4 py-1.5 text-zinc-50">
              Practice interview
            </span>
            <span className="text-base">→</span>
            <span className="rounded-full bg-emerald-500/90 px-4 py-1.5 text-zinc-50">
              Review AI feedback
            </span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Upcoming interviews are summarized in a list so users can jump straight into
            a practice session for the next conversation.
          </p>
        </div>
      </div>
    ),
    codeExample: `export function AuthWorkflow() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-zinc-50">
        Landing page
      </span>
      <span>→</span>
      <span className="rounded-full bg-zinc-100 px-4 py-1.5 text-zinc-900">
        Sign up / Sign in form
      </span>
      <span>→</span>
      <span className="rounded-full bg-emerald-500 px-4 py-1.5 text-zinc-50">
        Session created
      </span>
      <span>→</span>
      <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-zinc-50">
        Dashboard
      </span>
    </div>
  );
}
`,
  },
];

export default function DesignLibraryPage() {
  const [selectedId, setSelectedId] = useState<ComponentId>("home");

  const selected =
    COMPONENT_DOCS.find((component) => component.id === selectedId) ??
    COMPONENT_DOCS[0]!;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#f6f9ff] via-[#f9fff6] to-[#fefcf5] font-sans text-zinc-900 dark:bg-slate-950 dark:text-zinc-50">
      <aside className="flex h-full w-72 flex-col border-r border-zinc-200 bg-white/80 px-4 py-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Interview Prep Coach
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            UI component library
          </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Browse and interact with the core UI components that make up the Interview Prep Coach experience.
            </p>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
          <div className="mb-2.5">
            <button
              type="button"
              onClick={() => setSelectedId("home")}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition ${
                selectedId === "home"
                  ? "bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-500/10 text-[10px] text-sky-600 dark:text-sky-300">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                  >
                    <path
                      d="M5 5h14v10.5A1.5 1.5 0 0 1 17.5 17H9.2L6 19.6V17H5Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 9h8M8 12h4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>Home</span>
              </span>
            </button>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
              Components
            </p>
            <ul className="space-y-0.5">
              {COMPONENT_DOCS.filter((component) =>
                [
                  "buttonsAndActions",
                  "inputsAndSelectors",
                  "dropdownMenus",
                  "onboardingForm",
                  "onboardingWizard",
                  "rolesSection",
                  "togglesAndChips",
                ].includes(component.id),
              )
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((component) => {
                  const isActive = component.id === selectedId;
                  return (
                    <li key={component.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(component.id)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition ${
                          isActive
                            ? "bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                            : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <span>{component.name}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>

          <div className="mt-3.5">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
              Design foundations & flows
            </p>
            <ul className="space-y-0.5">
              {COMPONENT_DOCS.filter((component) =>
                [
                  "accessibility",
                  "architecture",
                  "colors",
                  "motion",
                  "typography",
                  "userWorkflows",
                ].includes(component.id),
              )
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((component) => {
                  const isActive = component.id === selectedId;
                  return (
                    <li key={component.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(component.id)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition ${
                          isActive
                            ? "bg-zinc-900 text-zinc-50 shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                            : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                        }`}
                      >
                        <span>{component.name}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-2.5 py-2 text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
            <p className="font-semibold text-zinc-800 dark:text-zinc-100">
              How to extend
            </p>
            <p className="mt-1">
              To add a new component to this library, edit
              <code className="mx-1 rounded bg-zinc-900/5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-900 dark:bg-zinc-50/10 dark:text-zinc-100">
                app/design-library/page.tsx
              </code>
              and append an entry to the COMPONENT_DOCS array.
            </p>
          </div>
        </nav>

        <div className="mt-4 border-t border-zinc-200 pt-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <p>
            Want to see components in context? Visit the
            <Link
              href="/dashboard"
              className="ml-1 font-medium text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              dashboard
            </Link>
            .
          </p>
        </div>
      </aside>

      <main
        className={`relative flex-1 overflow-y-auto overflow-x-hidden pb-6 ${
          selectedId === "home" ? "bg-[#020617]" : "bg-zinc-50 dark:bg-black"
        }`}
      >
        {selectedId === "home" && (
          <div className="pointer-events-none absolute inset-0 z-0">
            <DesignLibraryBackground />
          </div>
        )}

        <DesignSystemAgentChat isHome={selectedId === "home"} />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-4 px-6 pt-6">
          {selected && (
            <section className="flex flex-col gap-6">
              {selected.id !== "home" && (
              <header className="flex flex-col gap-3 border-b border-zinc-200 pb-4 dark:border-zinc-800">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                      {selected.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                      {selected.shortDescription}
                    </p>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap gap-1.5">
                  {selected.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </header>
            )}

            {selected.id === "home" ? (
              <>{selected.render()}</>
            ) : (
              <>
                <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <ComponentPreview render={selected.render} />
                </section>

                {selected.id !== "architecture" &&
                  selected.id !== "userWorkflows" &&
                  selected.id !== "accessibility" && (
                    <CodeExample code={selected.codeExample} />
                  )}

                {selected.usageNotes.length > 0 && (
                  <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                    <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Usage notes
                    </h3>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                      {selected.usageNotes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
