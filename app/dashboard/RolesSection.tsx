"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export type RoleSummary = {
  id: string;
  title: string;
  company?: string | null;
  level?: string | null;
  description?: string | null;
  status: string;
  createdAt: string;
};

export type RoleInterviewSummary = {
  id: string;
  interviewerType: string;
  interviewerName?: string | null;
  notes?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
};

export type UpcomingInterviewSummary = {
  id: string;
  roleId: string;
  roleTitle: string;
  company?: string | null;
  interviewerType: string;
  interviewerName?: string | null;
  scheduledAt: string;
  notes?: string | null;
};

type RolesSectionProps = {
  initialRoles: RoleSummary[];
  initialUpcomingInterviews?: UpcomingInterviewSummary[];
};

export function RolesSection({
  initialRoles,
  initialUpcomingInterviews = [],
}: RolesSectionProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleSummary[]>(initialRoles);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [isAddHovered, setIsAddHovered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingByRole, setDeletingByRole] = useState<Record<string, boolean>>(
    {},
  );

  const [interviewsByRole, setInterviewsByRole] = useState<
    Record<string, RoleInterviewSummary[]>
  >({});
  const [newInterviewTypeByRole, setNewInterviewTypeByRole] = useState<
    Record<string, string>
  >({});
  const [newInterviewNameByRole, setNewInterviewNameByRole] = useState<
    Record<string, string>
  >({});
  const [newInterviewDateByRole, setNewInterviewDateByRole] = useState<
    Record<string, string>
  >({});
  const [newInterviewTimeByRole, setNewInterviewTimeByRole] = useState<
    Record<string, string>
  >({});
  const [isInterviewerMenuOpenByRole, setIsInterviewerMenuOpenByRole] =
    useState<Record<string, boolean>>({});
  const [newInterviewNotesByRole, setNewInterviewNotesByRole] = useState<
    Record<string, string>
  >({});
  const [addingInterviewByRole, setAddingInterviewByRole] = useState<
    Record<string, boolean>
  >({});
  const [interviewErrorByRole, setInterviewErrorByRole] = useState<
    Record<string, string | null>
  >({});
  const [upcomingInterviews, setUpcomingInterviews] = useState<
    UpcomingInterviewSummary[]
  >(() => initialUpcomingInterviews);
  const [newRoleId, setNewRoleId] = useState<string | null>(null);
  const [transitionRole, setTransitionRole] = useState<
    | {
        id: string;
        top: number;
        left: number;
        width: number;
        height: number;
      }
    | null
  >(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Modal state for adding interviews
  const [modalRoleId, setModalRoleId] = useState<string | null>(null);
  const [modalName, setModalName] = useState("");
  const [modalType, setModalType] = useState("");
  const [modalTypeIsCustom, setModalTypeIsCustom] = useState(false);
  const [modalTypeCustom, setModalTypeCustom] = useState("");
  const [modalDate, setModalDate] = useState("");
  const [modalTime, setModalTime] = useState("");
  const [modalNotes, setModalNotes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalIsSubmitting, setModalIsSubmitting] = useState(false);
  const [modalAddedCount, setModalAddedCount] = useState(0);

  // For "View next interview" highlight behavior
  const upcomingRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightedUpcomingId, setHighlightedUpcomingId] = useState<string | null>(null);

  // Modal for viewing saved AI notes/feedback for a specific interview
  const [notesModalInterviewId, setNotesModalInterviewId] = useState<string | null>(null);

  const hasRoles = roles.length > 0;

  // Hydrate interviews for existing roles when the component mounts.
  useEffect(() => {
    if (!hasRoles) return;

    let cancelled = false;

    async function loadInterviews() {
      try {
        const results = await Promise.all(
          roles.map(async (role) => {
            try {
              const response = await fetch(
                `/api/roles/${role.id}/interviews`,
                {
                  method: "GET",
                  headers: {
                    Accept: "application/json",
                  },
                },
              );

              if (!response.ok) {
                return { roleId: role.id, interviews: [] as RoleInterviewSummary[] };
              }

              const data = (await response
                .json()
                .catch(() => ({}))) as {
                interviews?: RoleInterviewSummary[];
              };

              return {
                roleId: role.id,
                interviews: data.interviews ?? [],
              };
            } catch {
              return { roleId: role.id, interviews: [] as RoleInterviewSummary[] };
            }
          }),
        );

        if (cancelled) return;

        setInterviewsByRole((prev) => {
          const next = { ...prev };
          for (const { roleId, interviews } of results) {
            if (!next[roleId] || next[roleId]!.length === 0) {
              next[roleId] = interviews;
            }
          }
          return next;
        });
      } catch {
        // Best-effort only; ignore errors here.
      }
    }

    loadInterviews();

    return () => {
      cancelled = true;
    };
  }, [hasRoles, roles]);

  useEffect(() => {
    if (!newRoleId) return;

    const timeoutId = window.setTimeout(() => {
      setNewRoleId(null);
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [newRoleId]);

  async function createRoleInternal(): Promise<RoleSummary | null> {
    if (!title.trim()) {
      setError("Role title is required");
      return null;
    }

    if (!description.trim()) {
      setError("Role description is required");
      return null;
    }

    setError(null);

    const response = await fetch("/api/roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        company,
        level,
        description,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      success?: boolean;
      role?: RoleSummary;
    };

    if (!response.ok || !data.success || !data.role) {
      setError(data.error || "Unable to create role. Please try again.");
      return null;
    }

    setRoles((prev) => [data.role!, ...prev]);
    setNewRoleId(data.role.id);
    setTitle("");
    setCompany("");
    setLevel("");
    setDescription("");

    return data.role!;
  }

  async function handleCreateRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const created = await createRoleInternal();
      if (!created) return;
      setIsAdding(false);
    } catch {
      if (!error) {
        setError("Unable to create role. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateRoleAndAddInterviews(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const created = await createRoleInternal();
      if (!created) return;
      setIsAdding(false);
      // Immediately open the interview modal for the newly created role.
      setModalRoleId(created.id);
      setModalName("");
      setModalType("");
      setModalTypeIsCustom(false);
      setModalTypeCustom("");
      setModalDate("");
      setModalTime("");
      setModalNotes("");
      setModalError(null);
      setModalAddedCount(0);
    } catch {
      if (!error) {
        setError("Unable to create role. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddInterview(
    roleId: string,
    {
      name,
      type,
      date,
      time,
      notes,
      fromModal,
    }: {
      name: string;
      type: string;
      date: string;
      time: string;
      notes: string;
      fromModal: boolean;
    },
  ) {
    const trimmedType = type.trim();
    const trimmedName = name.trim();
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedType) {
      if (fromModal) setModalError("Interviewer role is required");
      else
        setInterviewErrorByRole((prev) => ({
          ...prev,
          [roleId]: "Interviewer role is required",
        }));
      return;
    }

    if (!trimmedName) {
      if (fromModal) setModalError("Interviewer name is required");
      else
        setInterviewErrorByRole((prev) => ({
          ...prev,
          [roleId]: "Interviewer name is required",
        }));
      return;
    }

    if (!trimmedDate || !trimmedTime) {
      if (fromModal) setModalError("Date and time are required");
      else
        setInterviewErrorByRole((prev) => ({
          ...prev,
          [roleId]: "Date and time are required",
        }));
      return;
    }

    try {
      if (fromModal) {
        setModalIsSubmitting(true);
        setModalError(null);
      } else {
        setAddingInterviewByRole((prev) => ({ ...prev, [roleId]: true }));
        setInterviewErrorByRole((prev) => ({ ...prev, [roleId]: null }));
      }

      const scheduledAt = new Date(`${trimmedDate}T${trimmedTime}:00`);
      if (Number.isNaN(scheduledAt.getTime())) {
        const msg = "Date and time must be valid";
        if (fromModal) setModalError(msg);
        else
          setInterviewErrorByRole((prev) => ({
            ...prev,
            [roleId]: msg,
          }));
        return;
      }

      const response = await fetch(`/api/roles/interviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleId,
          interviewerType: trimmedType,
          interviewerName: trimmedName,
          scheduledAt: scheduledAt.toISOString(),
          notes: trimmedNotes,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
        interview?: RoleInterviewSummary;
      };

      if (!response.ok || !data.success || !data.interview) {
        const msg = data.error || "Unable to add interview. Please try again.";
        if (fromModal) setModalError(msg);
        else
          setInterviewErrorByRole((prev) => ({
            ...prev,
            [roleId]: msg,
          }));
        return;
      }

      setInterviewsByRole((prev) => ({
        ...prev,
        [roleId]: [data.interview!, ...(prev[roleId] ?? [])],
      }));
      setNewInterviewTypeByRole((prev) => ({ ...prev, [roleId]: "" }));
      setNewInterviewNameByRole((prev) => ({ ...prev, [roleId]: "" }));
      setNewInterviewDateByRole((prev) => ({ ...prev, [roleId]: "" }));
      setNewInterviewTimeByRole((prev) => ({ ...prev, [roleId]: "" }));
      setNewInterviewNotesByRole((prev) => ({ ...prev, [roleId]: "" }));

      // If this interview is in the future, add it to upcoming list.
      if (data.interview?.scheduledAt) {
        const scheduled = new Date(data.interview.scheduledAt);
        if (!Number.isNaN(scheduled.getTime()) && scheduled.getTime() >= Date.now()) {
          const roleMeta = roles.find((r) => r.id === roleId);
          setUpcomingInterviews((prev) => {
            const next: UpcomingInterviewSummary[] = [
              ...prev,
              {
                id: data.interview!.id,
                roleId,
                roleTitle: roleMeta?.title ?? "",
                company: roleMeta?.company ?? null,
                interviewerType: data.interview!.interviewerType,
                interviewerName: data.interview!.interviewerName ?? null,
                scheduledAt: data.interview!.scheduledAt!,
              },
            ];
            return next.sort(
              (a, b) =>
                new Date(a.scheduledAt).getTime() -
                new Date(b.scheduledAt).getTime(),
            );
          });
        }
      }

      if (fromModal) {
        setModalAddedCount((count) => count + 1);
        setModalName("");
        setModalType("");
        setModalTypeIsCustom(false);
        setModalTypeCustom("");
        setModalDate("");
        setModalTime("");
        setModalNotes("");
      }
    } catch {
      const msg = "Unable to add interview. Please try again.";
      if (fromModal) setModalError(msg);
      else
        setInterviewErrorByRole((prev) => ({
          ...prev,
          [roleId]: msg,
        }));
    } finally {
      if (fromModal) setModalIsSubmitting(false);
      else setAddingInterviewByRole((prev) => ({ ...prev, [roleId]: false }));
    }
  }

  async function handleDeleteRole(roleId: string) {
    const confirmed = window.confirm(
      "Delete this role and its interviews? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      setDeletingByRole((prev) => ({ ...prev, [roleId]: true }));
      setError(null);

      const response = await fetch("/api/roles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleId }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !data.success) {
        setError(data.error || "Unable to delete role. Please try again.");
        return;
      }

      // Remove role and any associated interviews from local state immediately.
      setRoles((prev) => prev.filter((role) => role.id !== roleId));
      setInterviewsByRole((prev) => {
        const next = { ...prev };
        delete next[roleId];
        return next;
      });
      setUpcomingInterviews((prev) =>
        prev.filter((iv) => iv.roleId !== roleId),
      );
      setHighlightedUpcomingId((current) =>
        current && !upcomingInterviews.some((iv) => iv.id === current)
          ? null
          : current,
      );
    } catch {
      setError("Unable to delete role. Please try again.");
    } finally {
      setDeletingByRole((prev) => ({ ...prev, [roleId]: false }));
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-950">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Roles
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Add roles you’re interviewing for so we can organize interviewers and
          prep around each one.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative h-full"
          >
            <AnimatePresence mode="wait" initial={false}>
              {!isAdding ? (
                <motion.button
                  key="add-card"
                  type="button"
                  onClick={() => {
                    setIsAdding(true);
                    setError(null);
                  }}
                  onHoverStart={() => setIsAddHovered(true)}
                  onHoverEnd={() => setIsAddHovered(false)}
                  className="relative flex h-full min-h-[220px] w-full flex-col overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-center text-xs text-zinc-700 shadow-sm transition-all duration-200 ease-out hover:border-zinc-400 hover:bg-white/80 hover:shadow-lg hover:-translate-y-0.5 hover:scale-[1.02] cursor-pointer dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-200 dark:hover:border-zinc-400 dark:hover:bg-zinc-900 dark:hover:shadow-xl"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* internal organic gradient motion, clipped to card */}
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.3),transparent_55%)] opacity-0"
                    initial={false}
                    animate={
                      isAddHovered && !isAdding
                        ? {
                            opacity: 0.8,
                            scale: [1, 1.06, 1.02, 1],
                            x: [0, 4, -3, 0],
                            y: [0, -3, 2, 0],
                          }
                        : {
                            opacity: 0,
                            scale: 1,
                            x: 0,
                            y: 0,
                          }
                    }
                    transition={{
                      duration: 2.2,
                      ease: "easeInOut",
                      repeat: isAddHovered && !isAdding ? Infinity : 0,
                      repeatType: "mirror",
                    }}
                  />

                  <div className="flex-[0.8]" />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <span className="text-6xl font-black leading-none text-blue-600 dark:text-blue-400">
                      +
                    </span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Add new role
                    </span>
                  </div>
                  <div className="flex-[1.2]" />
                </motion.button>
              ) : (
                <motion.form
                  key="add-form"
                  onSubmit={handleCreateRole}
                  className="flex h-full flex-col space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/40"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-1">
                    <label
                      htmlFor="role-company"
                      className="block text-[11px] font-medium text-zinc-800 dark:text-zinc-200"
                    >
                      Company
                    </label>
                    <input
                      id="role-company"
                      type="text"
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                      placeholder="Acme Corp"
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="role-title"
                      className="block text-[11px] font-medium text-zinc-800 dark:text-zinc-200"
                    >
                      Role title
                    </label>
                    <input
                      id="role-title"
                      type="text"
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                      placeholder="Senior Product Manager"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="role-description"
                      className="block text-[11px] font-medium text-zinc-800 dark:text-zinc-200"
                    >
                      Job description
                    </label>
                    <textarea
                      id="role-description"
                      rows={3}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                      placeholder="Paste the job description or a link to the role."
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </div>

                  {error && (
                    <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
                  )}

                  <div className="mt-auto flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        setError(null);
                      }}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateRoleAndAddInterviews}
                      disabled={isSubmitting}
                      className="rounded-md bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-50 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {isSubmitting ? "Saving..." : "Add interviews"}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-zinc-50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {isSubmitting ? "Saving..." : "Save role"}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {!hasRoles && (
          <div className="relative flex h-full min-h-[220px] flex-col justify-center overflow-hidden rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-6 text-base text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200 sm:col-span-1 lg:col-span-2">
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.3),transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.25),transparent_55%)] dark:opacity-70"
              initial={{ opacity: 0.5, scale: 1, x: 0, y: 0 }}
              animate={{ opacity: 0.8, scale: 1.04, x: 6, y: -4 }}
              transition={{
                duration: 8,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            <div className="relative z-10 max-w-md">
              <h3 className="mb-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                Tell us what you’re interviewing for
              </h3>
              <p className="mb-2 text-base text-zinc-800 dark:text-zinc-200">
                Click Add new role to set up a job you’re interviewing for. Once it’s added, you can specify interviewers and run practice interviews with our AI agents for targeted feedback and suggestions.
              </p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                We will keep each role, its interviewers, and your prep work organized so you always know what to focus on next.
              </p>
            </div>
          </div>
        )}

        {roles.map((role) => (
          <motion.div
            key={role.id}
            layout
            initial={
              role.id === newRoleId
                ? { opacity: 0, x: -24 }
                : { opacity: 0, y: 8 }
            }
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="h-full"
          >
            <div
              role="button"
              tabIndex={0}
              ref={(element) => {
                if (element) {
                  cardRefs.current[role.id] = element;
                }
              }}
              onClick={() => {
                const element = cardRefs.current[role.id];
                if (element && typeof window !== "undefined") {
                  const rect = element.getBoundingClientRect();
                  setTransitionRole({
                    id: role.id,
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                  });

                  window.setTimeout(() => {
                    router.push(`/dashboard/roles/${role.id}`);
                  }, 240);
                } else {
                  router.push(`/dashboard/roles/${role.id}`);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/dashboard/roles/${role.id}`);
                }
              }}
              className="group relative flex h-full min-h-[220px] flex-col rounded-xl border border-zinc-200 bg-white px-3 py-3 text-xs text-zinc-700 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:border-zinc-300 hover:bg-white/80 hover:shadow-lg cursor-pointer dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-900 dark:hover:shadow-xl"
            >
              <div className="mb-0.5 flex items-start justify-between gap-0.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-zinc-950 dark:text-zinc-50 group-hover:underline">
                    {role.company || "Company"}
                  </p>
                  <p className="truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    {role.title}
                    {role.level && (
                      <span className="text-zinc-400 dark:text-zinc-500">
                        {" "}· {role.level}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteRole(role.id);
                  }}
                  disabled={!!deletingByRole[role.id]}
                  aria-label="Delete role"
                  className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10"
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
              </div>

              <div className="min-w-0 flex-1 flex flex-col">
                <div className="mt-3 flex flex-col space-y-1">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                    Interviews
                  </p>

                  {(interviewsByRole[role.id] ?? []).length > 0 ? (
                    <motion.ul
                      layout
                      className="space-y-0.5 text-[11px] text-zinc-600 dark:text-zinc-300"
                    >
                      {(interviewsByRole[role.id] ?? []).map((iv) => (
                        <motion.li
                          key={iv.id}
                          layout
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="flex flex-col"
                        >
                          <span className="font-medium text-zinc-800 dark:text-zinc-100">
                            {iv.interviewerName || iv.interviewerType}
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {iv.interviewerName ? iv.interviewerType : null}
                            {iv.interviewerName && iv.interviewerType ? " • " : ""}
                            {iv.scheduledAt
                              ? new Date(iv.scheduledAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : null}
                          </span>
                          {iv.notes && (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                              {iv.notes}
                            </span>
                          )}
                        </motion.li>
                      ))}
                    </motion.ul>
                  ) : (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      No interviews recorded yet.
                    </p>
                  )}

                  <div className="mt-auto pt-2 flex flex-row gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setModalRoleId(role.id);
                        setModalName("");
                        setModalType("");
                        setModalDate("");
                        setModalTime("");
                        setModalNotes("");
                        setModalError(null);
                        setModalAddedCount(0);
                      }}
                      className="flex-1 rounded-md bg-zinc-900 px-3 py-1.5 text-[10px] font-semibold text-zinc-50 shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-offset-zinc-900"
                    >
                      Add interviews
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        const nextForRole = upcomingInterviews.find(
                          (iv) => iv.roleId === role.id,
                        );
                        if (!nextForRole) return;
                        const row = upcomingRowRefs.current[nextForRole.id];
                        if (row) {
                          row.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                          setHighlightedUpcomingId(nextForRole.id);
                          window.setTimeout(
                            () => setHighlightedUpcomingId(null),
                            2000,
                          );
                        }
                      }}
                      disabled={
                        !upcomingInterviews.some((iv) => iv.roleId === role.id)
                      }
                      className="flex-1 rounded-md bg-zinc-200 px-3 py-1.5 text-[10px] font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-300 disabled:cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-600"
                    >
                      View next interview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {transitionRole && (
          <motion.div
            key="role-grow-overlay"
            initial={{
              top: transitionRole.top,
              left: transitionRole.left,
              width: transitionRole.width,
              height: transitionRole.height,
              borderRadius: 16,
              opacity: 1,
            }}
            animate={{
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              borderRadius: 0,
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[950] bg-white shadow-2xl dark:bg-zinc-950"
            style={{ position: "fixed" }}
          />
        )}
      </AnimatePresence>

      {upcomingInterviews.length > 0 && (
        <section className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            Upcoming interviews
          </h3>

          <div className="space-y-2">
            {upcomingInterviews.map((iv) => {
              const dateObj = new Date(iv.scheduledAt);
              const day = dateObj.toLocaleDateString(undefined, {
                day: "numeric",
              });
              const month = dateObj.toLocaleDateString(undefined, {
                month: "short",
              });
              const time = dateObj.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              });

              const hasNotes = typeof iv.notes === "string" && iv.notes.trim() !== "";

              return (
                <div
                  key={iv.id}
                  ref={(element) => {
                    if (element) {
                      upcomingRowRefs.current[iv.id] = element;
                    }
                  }}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs shadow-sm transition-colors ${
                    highlightedUpcomingId === iv.id
                      ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40"
                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex w-full items-start gap-3 sm:gap-4 md:gap-6">
                    {/* Column 1: date pill */}
                    <div className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 px-2 py-1 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 shrink-0 mr-2 sm:mr-0">
                      <span className="text-lg font-bold leading-tight">
                        {day}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide">
                        {month}
                      </span>
                    </div>

                    {/* Column 2: company / role / time */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
                        {iv.company || "Company"}
                      </p>
                      <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                        {iv.roleTitle}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                        {time} · {iv.interviewerName || "Interviewer"} ({
                          iv.interviewerType
                        })
                      </p>
                    </div>

                    {/* Column 3: AI tips card */}
                    {hasNotes && (
                      <div className="w-44 max-w-[40%] rounded-md bg-zinc-50 px-2 py-1.5 text-[10px] text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-200 dark:ring-zinc-700">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                          AI tips
                        </p>
                        <p className="mt-0.5">
                          {(iv.notes || "").length > 200
                            ? `${iv.notes!.slice(0, 200)}…`
                            : iv.notes}
                        </p>
                        <button
                          type="button"
                          onClick={() => setNotesModalInterviewId(iv.id)}
                          className="mt-1 text-[10px] font-medium text-blue-600 underline underline-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View all AI feedback
                        </button>
                      </div>
                    )}

                    {/* Column 4: AI interview button */}
                    <div className="ml-2 flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/dashboard/roles/${iv.roleId}/practice?interviewId=${iv.id}`,
                          )
                        }
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                      >
                        AI interview
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {notesModalInterviewId && (
        <AnimatePresence>
          <motion.div
            key="notes-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-xs shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            >
              {(() => {
                const match = upcomingInterviews.find((iv) => iv.id === notesModalInterviewId);
                const notesText = match?.notes?.trim() ?? "";
                return (
                  <>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          Interview notes and feedback
                        </h2>
                        {match && (
                          <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                            {match.company || "Company"} · {match.roleTitle}
                            {match.interviewerName
                              ? ` · ${match.interviewerName} (${match.interviewerType})`
                              : ""}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotesModalInterviewId(null)}
                        aria-label="Close notes"
                        className="-mt-1 -mr-1 inline-flex h-6 w-6 items-center justify-center text-lg font-black leading-none text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                      >
                        ×
                      </button>
                    </div>

                    {notesText ? (
                      <div className="mt-2 max-h-64 overflow-y-auto rounded-md bg-zinc-50 p-3 text-[11px] leading-relaxed text-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-100">
                        {notesText}
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        There are no saved notes for this interview yet.
                      </p>
                    )}
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {modalRoleId && (
        <AnimatePresence>
          <motion.div
            key="add-interviews-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-xs shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Add interviews
                  </h2>
                  <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                    Add one or more upcoming interviews for this role. You can keep adding
                    interviews, then click Done when you are finished.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalRoleId(null);
                    setModalError(null);
                    setModalAddedCount(0);
                  }}
                  aria-label="Close"
                  className="-mt-2 -mr-2 inline-flex h-6 w-6 items-center justify-center text-lg font-black leading-none text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!modalRoleId) return;
                  void handleAddInterview(modalRoleId, {
                    name: modalName,
                    type: modalTypeIsCustom ? modalTypeCustom : modalType,
                    date: modalDate,
                    time: modalTime,
                    notes: modalNotes,
                    fromModal: true,
                  });
                }}
                className="space-y-3"
              >
                <div className="space-y-1">
                  <label className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                    Interviewer name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                    value={modalName}
                    onChange={(event) => setModalName(event.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                    Interviewer role
                  </label>
                  <select
                    className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                    value={modalTypeIsCustom ? "__custom" : modalType}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === "__custom") {
                        setModalTypeIsCustom(true);
                        setModalType("");
                      } else {
                        setModalTypeIsCustom(false);
                        setModalType(value);
                      }
                    }}
                  >
                    <option value="">Select a role</option>
                    <option value="Hiring Manager">Hiring Manager</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Designer">Designer</option>
                    <option value="Developer">Developer</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Director">Director</option>
                    <option value="VP">VP</option>
                    <option value="CEO">CEO</option>
                    <option value="CTO">CTO</option>
                    <option value="__custom">Add manually…</option>
                  </select>
                  {modalTypeIsCustom && (
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                      placeholder="Type interviewer role"
                      value={modalTypeCustom}
                      onChange={(event) => setModalTypeCustom(event.target.value)}
                    />
                  )}
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                      value={modalDate}
                      onChange={(event) => setModalDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                      Time
                    </label>
                    <input
                      type="time"
                      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                      value={modalTime}
                      onChange={(event) => setModalTime(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                    Notes (optional)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                    value={modalNotes}
                    onChange={(event) => setModalNotes(event.target.value)}
                  />
                </div>

                {modalError && (
                  <p className="text-[10px] text-red-600 dark:text-red-400">{modalError}</p>
                )}
                {modalAddedCount > 0 && !modalError && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {modalAddedCount === 1
                      ? "1 interview added."
                      : `${modalAddedCount} interviews added.`}
                  </p>
                )}

                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalRoleId(null);
                      setModalError(null);
                      setModalAddedCount(0);
                    }}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Done
                  </button>
                  <button
                    type="submit"
                    disabled={modalIsSubmitting}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-zinc-50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {modalIsSubmitting ? "Adding..." : "Add interview"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
}
