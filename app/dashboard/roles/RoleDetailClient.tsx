"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { motion } from "framer-motion";

export type RoleDetail = {
  id: string;
  title: string;
  company?: string | null;
  level?: string | null;
  description: string;
};

export type RoleInterviewDetail = {
  id: string;
  interviewerType: string;
  interviewerName?: string | null;
  notes?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
};

export type RolePrepItemDetail = {
  id: string;
  title: string;
  details?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type RoleDetailClientProps = {
  initialRole: RoleDetail;
  initialInterviews: RoleInterviewDetail[];
  initialPrepItems: RolePrepItemDetail[];
};

export function RoleDetailClient({
  initialRole,
  initialInterviews,
  initialPrepItems,
}: RoleDetailClientProps) {
  const router = useRouter();
  const [company, setCompany] = useState(initialRole.company ?? "");
  const [title, setTitle] = useState(initialRole.title);
  const [level, setLevel] = useState(initialRole.level ?? "");
  const [description, setDescription] = useState(initialRole.description);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleSaved, setRoleSaved] = useState(false);
  const [roleBaseline, setRoleBaseline] = useState({
    title: initialRole.title,
    company: initialRole.company ?? "",
    level: initialRole.level ?? "",
    description: initialRole.description,
  });

  const [interviews, setInterviews] = useState<RoleInterviewDetail[]>(
    initialInterviews,
  );
  const [interviewErrors, setInterviewErrors] = useState<
    Record<string, string | null>
  >({});
  const [savingInterview, setSavingInterview] = useState<
    Record<string, boolean>
  >({});
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null,
  );
  const scheduleDateInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );
  const [deletingInterview, setDeletingInterview] = useState<
    Record<string, boolean>
  >({});
  const [interviewBaselines, setInterviewBaselines] = useState<
    Record<string, RoleInterviewDetail>
  >(() => {
    const map: Record<string, RoleInterviewDetail> = {};
    for (const iv of initialInterviews) {
      map[iv.id] = iv;
    }
    return map;
  });

  const [prepItems, setPrepItems] = useState<RolePrepItemDetail[]>(
    initialPrepItems,
  );
  const [prepBaselines, setPrepBaselines] = useState<
    Record<string, RolePrepItemDetail>
  >(() => {
    const map: Record<string, RolePrepItemDetail> = {};
    for (const item of initialPrepItems) {
      map[item.id] = item;
    }
    return map;
  });
  const [newPrepTitle, setNewPrepTitle] = useState("");
  const [newPrepDetails, setNewPrepDetails] = useState("");
  const [newPrepStatus, setNewPrepStatus] = useState("not_started");
  const [isAddingPrep, setIsAddingPrep] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [savingPrepById, setSavingPrepById] = useState<Record<string, boolean>>({});
  const [deletingPrepById, setDeletingPrepById] = useState<
    Record<string, boolean>
  >({});

  const roleDirty =
    company !== roleBaseline.company ||
    title !== roleBaseline.title ||
    level !== roleBaseline.level ||
    description !== roleBaseline.description;

  async function handleSaveRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company.trim()) {
      setRoleError("Company is required");
      return;
    }
    if (!title.trim()) {
      setRoleError("Role title is required");
      return;
    }
    if (!description.trim()) {
      setRoleError("Role description is required");
      return;
    }

    try {
      setIsSavingRole(true);
      setRoleError(null);
      setRoleSaved(false);

      const response = await fetch("/api/roles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleId: initialRole.id,
          title,
          company,
          level,
          description,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !data.success) {
        setRoleError(data.error || "Unable to save role. Please try again.");
        return;
      }

      setRoleBaseline({ title, company, level, description });
      setRoleSaved(true);
    } catch {
      setRoleError("Unable to save role. Please try again.");
    } finally {
      setIsSavingRole(false);
    }
  }

  async function handleSaveInterview(iv: RoleInterviewDetail) {
    if (!iv.interviewerType.trim()) {
      setInterviewErrors((prev) => ({
        ...prev,
        [iv.id]: "Interviewer type is required",
      }));
      return;
    }

    try {
      setSavingInterview((prev) => ({ ...prev, [iv.id]: true }));
      setInterviewErrors((prev) => ({ ...prev, [iv.id]: null }));

      const response = await fetch("/api/roles/interviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interviewId: iv.id,
          interviewerType: iv.interviewerType,
          notes: iv.notes ?? "",
          scheduledAt: iv.scheduledAt ?? null,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !data.success) {
        setInterviewErrors((prev) => ({
          ...prev,
          [iv.id]: data.error || "Unable to save interview.",
        }));
        return;
      }

      setInterviewBaselines((prev) => ({
        ...prev,
        [iv.id]: { ...iv },
      }));
      setEditingScheduleId((current) => (current === iv.id ? null : current));
    } catch {
      setInterviewErrors((prev) => ({
        ...prev,
        [iv.id]: "Unable to save interview.",
      }));
    } finally {
      setSavingInterview((prev) => ({ ...prev, [iv.id]: false }));
    }
  }

  async function handleDeleteInterview(id: string) {
    const confirmed = window.confirm(
      "Delete this interview? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      setDeletingInterview((prev) => ({ ...prev, [id]: true }));
      setInterviewErrors((prev) => ({ ...prev, [id]: null }));

      const response = await fetch("/api/roles/interviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interviewId: id }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !data.success) {
        setInterviewErrors((prev) => ({
          ...prev,
          [id]: data.error || "Unable to delete interview.",
        }));
        return;
      }

      setInterviews((prev) => prev.filter((iv) => iv.id !== id));
      setInterviewBaselines((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      setInterviewErrors((prev) => ({
        ...prev,
        [id]: "Unable to delete interview.",
      }));
    } finally {
      setDeletingInterview((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleAddPrepItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newPrepTitle.trim()) {
      setPrepError("Title is required");
      return;
    }

    try {
      setIsAddingPrep(true);
      setPrepError(null);

      const response = await fetch("/api/roles/prep-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleId: initialRole.id,
          title: newPrepTitle,
          details: newPrepDetails,
          status: newPrepStatus,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
        prepItem?: RolePrepItemDetail;
      };

      if (!response.ok || !data.success || !data.prepItem) {
        setPrepError(data.error || "Unable to add prep item.");
        return;
      }

      setPrepItems((prev) => [...prev, data.prepItem!]);
      setPrepBaselines((prev) => ({
        ...prev,
        [data.prepItem!.id]: data.prepItem!,
      }));
      setNewPrepTitle("");
      setNewPrepDetails("");
      setNewPrepStatus("not_started");
    } catch {
      setPrepError("Unable to add prep item.");
    } finally {
      setIsAddingPrep(false);
    }
  }

  async function handleUpdatePrepItem(item: RolePrepItemDetail) {
    try {
      setSavingPrepById((prev) => ({ ...prev, [item.id]: true }));
      setPrepError(null);

      const response = await fetch("/api/roles/prep-items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prepItemId: item.id,
          title: item.title,
          details: item.details ?? "",
          status: item.status,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
        prepItem?: RolePrepItemDetail;
      };

      if (!response.ok || !data.success || !data.prepItem) {
        setPrepError(data.error || "Unable to update prep item.");
        return;
      }

      setPrepBaselines((prev) => ({
        ...prev,
        [item.id]: data.prepItem!,
      }));

      setPrepItems((prev) =>
        prev.map((existing) =>
          existing.id === item.id ? { ...existing, ...data.prepItem! } : existing,
        ),
      );
    } catch {
      setPrepError("Unable to update prep item.");
    } finally {
      setSavingPrepById((prev) => ({ ...prev, [item.id]: false }));
    }
  }

  async function handleDeletePrepItem(id: string) {
    const confirmed = window.confirm(
      "Delete this prep item? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      setDeletingPrepById((prev) => ({ ...prev, [id]: true }));
      setPrepError(null);

      const response = await fetch("/api/roles/prep-items", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prepItemId: id }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok || !data.success) {
        setPrepError(data.error || "Unable to delete prep item.");
        return;
      }

      setPrepItems((prev) => prev.filter((item) => item.id !== id));
      setPrepBaselines((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      setPrepError("Unable to delete prep item.");
    } finally {
      setDeletingPrepById((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveRole} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="role-company-detail"
              className="block text-xs font-medium text-zinc-800 dark:text-zinc-200"
            >
              Company
            </label>
            <input
              id="role-company-detail"
              type="text"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="role-title-detail"
              className="block text-xs font-medium text-zinc-800 dark:text-zinc-200"
            >
              Role title
            </label>
            <input
              id="role-title-detail"
              type="text"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="role-level-detail"
              className="block text-xs font-medium text-zinc-800 dark:text-zinc-200"
            >
              Level (optional)
            </label>
            <input
              id="role-level-detail"
              type="text"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="role-description-detail"
            className="block text-xs font-medium text-zinc-800 dark:text-zinc-200"
          >
            Role description
          </label>
          <textarea
            id="role-description-detail"
            rows={3}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        {roleError && (
          <p className="text-xs text-red-600 dark:text-red-400">{roleError}</p>
        )}
        {roleSaved && !roleError && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Changes saved.
          </p>
        )}

        {roleDirty && (
          <button
            type="submit"
            disabled={isSavingRole}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSavingRole ? "Saving..." : "Save role"}
          </button>
        )}
      </form>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Interviews
        </h2>
        {interviews.length === 0 ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            No interviews recorded yet for this role.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {interviews.map((iv) => {
              const baseline = interviewBaselines[iv.id];
              const scheduleDirty =
                baseline && baseline.scheduledAt !== iv.scheduledAt;
              const nonScheduleDirty = baseline
                ? iv.interviewerType !== baseline.interviewerType ||
                  (iv.notes ?? "") !== (baseline.notes ?? "")
                : false;
              const isDirty = nonScheduleDirty || !!scheduleDirty;

              const dateObj = iv.scheduledAt
                ? new Date(iv.scheduledAt)
                : new Date(iv.createdAt);
              const day = dateObj.toLocaleDateString(undefined, { day: "numeric" });
              const month = dateObj.toLocaleDateString(undefined, { month: "short" });
              const time = dateObj.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              });

              const scheduledDateValue = iv.scheduledAt
                ? iv.scheduledAt.slice(0, 10)
                : "";
              const scheduledTimeValue = iv.scheduledAt
                ? iv.scheduledAt.slice(11, 16)
                : "";
              return (
                <li
                  key={iv.id}
                  className="space-y-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                >
      {/* Top row echoing the Upcoming interviews styling, with actions on the right */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingScheduleId(iv.id);
              if (typeof window !== "undefined") {
                window.setTimeout(() => {
                  const input = scheduleDateInputRefs.current[iv.id];
                  if (input) {
                    input.focus();
                    // @ts-ignore
                    if (typeof (input as any).showPicker === "function") {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (input as any).showPicker();
                    }
                  }
                }, 0);
              }
            }}
            className="flex flex-col items-center justify-center rounded-lg bg-zinc-900 px-2 py-1 text-zinc-50 shadow-sm outline-none ring-0 transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <span className="text-lg font-bold leading-tight">{day}</span>
            <span className="text-[10px] uppercase tracking-wide">{month}</span>
          </button>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
              {initialRole.company || "Company"}
            </p>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
              {initialRole.title}
            </p>
            {editingScheduleId === iv.id ? (
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400">
                <input
                  ref={(element) => {
                    if (element) {
                      scheduleDateInputRefs.current[iv.id] = element;
                    }
                  }}
                  type="date"
                  value={scheduledDateValue}
                  onChange={(event) => {
                    const value = event.target.value;
                    const currentTime = scheduledTimeValue || "09:00";
                    const iso = value
                      ? `${value}T${currentTime}:00.000Z`
                      : null;
                    setInterviews((prev) =>
                      prev.map((item) =>
                        item.id === iv.id ? { ...item, scheduledAt: iso } : item,
                      ),
                    );
                    const input = event.target;
                    if (typeof window !== "undefined") {
                      window.setTimeout(() => input.blur(), 800);
                    }
                  }}
                  className="rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                />
                <input
                  type="time"
                  value={scheduledTimeValue}
                  onChange={(event) => {
                    const value = event.target.value;
                    const currentDate = scheduledDateValue || iv.scheduledAt?.slice(0, 10) || "";
                    const iso = currentDate
                      ? `${currentDate}T${value || "09:00"}:00.000Z`
                      : null;
                    setInterviews((prev) =>
                      prev.map((item) =>
                        item.id === iv.id ? { ...item, scheduledAt: iso } : item,
                      ),
                    );
                  }}
                  className="rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] text-zinc-900 shadow-sm outline-none ring-0 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                />
                {scheduleDirty && (
                  <button
                    type="button"
                    onClick={() => handleSaveInterview(iv)}
                    disabled={!!savingInterview[iv.id]}
                    className="ml-1 rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-zinc-50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {savingInterview[iv.id] ? "Saving..." : "Save"}
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingScheduleId(iv.id)}
                className="mt-0.5 text-left text-[10px] text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
              >
                {time} · {iv.interviewerName || "Interviewer"} ({iv.interviewerType})
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => handleDeleteInterview(iv.id)}
            disabled={!!deletingInterview[iv.id]}
            aria-label={deletingInterview[iv.id] ? "Deleting interview..." : "Delete interview"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10"
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
          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/roles/${initialRole.id}/practice?interviewId=${iv.id}`,
              )
            }
            className="group relative min-w-[120px] overflow-hidden rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),transparent_55%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.3),transparent_55%)] opacity-40 group-hover:opacity-90 group-hover:scale-[1.06]"
              initial={{ opacity: 0.4, scale: 1, x: 0, y: 0 }}
              animate={{
                x: [0, 3, -2, 0],
                y: [0, -2, 1, 0],
              }}
              transition={{
                duration: 5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
              }}
            />
            <span className="relative z-10 transition-colors duration-200 group-hover:text-blue-600">
              AI interview
            </span>
          </button>
        </div>
      </div>

                  {/* Editable fields */}
                  <div className="mt-2 space-y-1">
                    <div className="space-y-0.5">
                      <label className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                        Interviewer type
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                        value={iv.interviewerType}
                        onChange={(event) => {
                          const value = event.target.value;
                          setInterviews((prev) =>
                            prev.map((item) =>
                              item.id === iv.id
                                ? { ...item, interviewerType: value }
                                : item,
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                        value={iv.notes ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setInterviews((prev) =>
                            prev.map((item) =>
                              item.id === iv.id
                                ? { ...item, notes: value }
                                : item,
                            ),
                          );
                        }}
                      />
                    </div>
                  </div>

                  {interviewErrors[iv.id] && (
                    <p className="text-[10px] text-red-600 dark:text-red-400">
                      {interviewErrors[iv.id]}
                    </p>
                  )}

      <div className="mt-2 flex justify-end gap-2">
        {nonScheduleDirty && (
          <button
            type="button"
            onClick={() => handleSaveInterview(iv)}
            disabled={!!savingInterview[iv.id]}
            className="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-medium text-zinc-50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {savingInterview[iv.id] ? "Saving..." : "Save"}
          </button>
        )}
      </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Prep plan
        </h2>

        {prepItems.length === 0 ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            No prep items added yet for this role.
          </p>
        ) : (
          <ul className="space-y-2 text-xs">
            {prepItems.map((item) => {
              const baseline = prepBaselines[item.id];
              const isDirty = baseline
                ? item.title !== baseline.title ||
                  (item.details ?? "") !== (baseline.details ?? "") ||
                  item.status !== baseline.status
                : false;

              return (
                <li
                  key={item.id}
                  className="space-y-1 rounded-md border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-0.5">
                    <label className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                      Title
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                      value={item.title}
                      onChange={(event) => {
                        const value = event.target.value;
                        setPrepItems((prev) =>
                          prev.map((existing) =>
                            existing.id === item.id
                              ? { ...existing, title: value }
                              : existing,
                          ),
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                      Status
                    </label>
                    <select
                      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                      value={item.status}
                      onChange={(event) => {
                        const value = event.target.value;
                        setPrepItems((prev) =>
                          prev.map((existing) =>
                            existing.id === item.id
                              ? { ...existing, status: value }
                              : existing,
                          ),
                        );
                      }}
                    >
                      <option value="not_started">Not started</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="mt-1 space-y-0.5">
                  <label className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200">
                    Details (optional)
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                    value={item.details ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setPrepItems((prev) =>
                        prev.map((existing) =>
                          existing.id === item.id
                            ? { ...existing, details: value }
                            : existing,
                        ),
                      );
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDeletePrepItem(item.id)}
                    disabled={!!deletingPrepById[item.id]}
                    aria-label={deletingPrepById[item.id] ? "Deleting prep item..." : "Delete prep item"}
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[10px] font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
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
                  {isDirty && (
                    <button
                      type="button"
                      onClick={() => handleUpdatePrepItem(item)}
                      disabled={!!savingPrepById[item.id]}
                      className="rounded-md bg-zinc-900 px-2 py-1 text-[10px] font-medium text-zinc-50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {savingPrepById[item.id] ? "Saving..." : "Save"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          </ul>
        )}

        <form
          onSubmit={handleAddPrepItem}
          className="mt-3 space-y-2 rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-xs dark:border-zinc-700 dark:bg-zinc-900/40"
        >
          <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-100">
            Add a prep item
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-0.5">
              <label
                htmlFor="prep-title"
                className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200"
              >
                Title
              </label>
              <input
                id="prep-title"
                type="text"
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                placeholder="e.g. Practice behavioral questions"
                value={newPrepTitle}
                onChange={(event) => setNewPrepTitle(event.target.value)}
              />
            </div>
            <div className="space-y-0.5">
              <label
                htmlFor="prep-status"
                className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200"
              >
                Status
              </label>
              <select
                id="prep-status"
                className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
                value={newPrepStatus}
                onChange={(event) => setNewPrepStatus(event.target.value)}
              >
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="space-y-0.5">
            <label
              htmlFor="prep-details"
              className="block text-[10px] font-medium text-zinc-800 dark:text-zinc-200"
            >
              Details (optional)
            </label>
            <textarea
              id="prep-details"
              rows={2}
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-sm outline-none ring-0 transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-500 dark:focus:ring-zinc-800"
              placeholder="What you want to cover or resources you want to use."
              value={newPrepDetails}
              onChange={(event) => setNewPrepDetails(event.target.value)}
            />
          </div>

          {prepError && (
            <p className="text-[10px] text-red-600 dark:text-red-400">{prepError}</p>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isAddingPrep}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-zinc-50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isAddingPrep ? "Adding..." : "Add prep item"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
