import type { Task, TaskInput, TaskPatch } from "./types";

export type DisplayStatus = "completed" | "overdue" | "due-soon" | "pending";

export const STATUS_LABEL: Record<DisplayStatus, string> = {
  completed: "Completed",
  overdue: "Overdue",
  "due-soon": "Due soon",
  pending: "Pending",
};

export function formatMinutes(total: number): string {
  const safe = Math.max(Math.round(total), 0);
  const days = Math.floor(safe / 1440);
  const hours = Math.floor((safe % 1440) / 60);
  const mins = safe % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hr`);
  if (mins) parts.push(`${mins} min`);
  return parts.slice(0, 2).join(" ") || "0 min";
}

/** Minutes from now until a date string (negative if in the past). */
export function minutesUntil(value: string): number {
  return (new Date(value).getTime() - Date.now()) / 60000;
}

export function timeLeft(deadlineIso: string): string {
  const diff = Math.round(minutesUntil(deadlineIso));
  const label = formatMinutes(Math.abs(diff));
  return diff >= 0 ? `in ${label}` : `${label} overdue`;
}

export function displayStatus(task: Task): DisplayStatus {
  if (task.status === "completed") return "completed";
  const minutes = minutesUntil(task.deadline);
  if (minutes < 0) return "overdue";
  if (minutes <= 24 * 60) return "due-soon";
  return "pending";
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

/** Value format required by <input type="datetime-local">, in local time. */
export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

const toMinute = (iso: string) => Math.floor(new Date(iso).getTime() / 60000);

/** Only the fields that changed, so untouched fields are never re-validated by the API. */
export function buildPatch(task: Task, values: TaskInput): TaskPatch {
  const patch: TaskPatch = {};
  if (values.title !== task.title) patch.title = values.title;
  if (values.description !== task.description) patch.description = values.description;
  if (values.assignee_email !== task.assignee_email) patch.assignee_email = values.assignee_email;
  // datetime-local drops seconds, so compare at minute precision
  if (toMinute(values.deadline) !== toMinute(task.deadline)) patch.deadline = values.deadline;
  if (values.remind_before_minutes !== task.remind_before_minutes) {
    patch.remind_before_minutes = values.remind_before_minutes;
  }
  return patch;
}