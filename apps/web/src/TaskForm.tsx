import { useEffect, useState, type FormEvent } from "react";
import { MAX_REMINDER, MIN_REMINDER, ReminderPicker } from "./ReminderPicker";
import type { Task, TaskInput } from "./types";
import { formatMinutes, minutesUntil, toLocalInputValue } from "./utils";

interface Props {
  task?: Task | null;
  onClose: () => void;
  onSubmit: (input: TaskInput) => Promise<void>;
}

export function TaskForm({ task, onClose, onSubmit }: Props) {
  const editing = Boolean(task);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [email, setEmail] = useState(task?.assignee_email ?? "");
  const [deadline, setDeadline] = useState(task ? toLocalInputValue(new Date(task.deadline)) : "");
  const [remindBefore, setRemindBefore] = useState(task?.remind_before_minutes ?? 1440);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const untilDeadline = deadline ? minutesUntil(deadline) : null;
  const windowTooLong =
    untilDeadline !== null && untilDeadline > 0 && remindBefore > untilDeadline;
  const scheduleChanged =
    !task ||
    remindBefore !== task.remind_before_minutes ||
    Math.floor(new Date(deadline).getTime() / 60000) !==
      Math.floor(new Date(task.deadline).getTime() / 60000);
  const reminderInvalid =
    !Number.isFinite(remindBefore) || remindBefore < MIN_REMINDER || remindBefore > MAX_REMINDER;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        assignee_email: email,
        deadline: new Date(deadline).toISOString(),
        remind_before_minutes: remindBefore,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <div>
            <h2 id="drawer-title">{editing ? "Edit task" : "New task"}</h2>
            <p className="muted">
              {editing
                ? "Update the details. Changing the deadline or reminder reschedules the email."
                : "Assign work and choose when the assignee is reminded."}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </header>

        <form onSubmit={handleSubmit} className="drawer-form">
          <div className="drawer-body">
            <label className="field">
              <span>Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} autoFocus />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </label>

            <label className="field">
              <span>Assignee email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <label className="field">
              <span>Deadline</span>
              <input
                type="datetime-local"
                value={deadline}
                min={editing ? undefined : toLocalInputValue(new Date())}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </label>

            <div className="field">
              <span>Remind assignee</span>
              <ReminderPicker value={remindBefore} onChange={setRemindBefore} />
            </div>

            {windowTooLong && scheduleChanged && untilDeadline !== null && (
              <div className="notice">
                The deadline is only {formatMinutes(untilDeadline)} away, which is shorter than the{" "}
                {formatMinutes(remindBefore)} reminder window. The reminder email will be sent
                immediately after you {editing ? "save" : "create the task"}.
              </div>
            )}

            {error && <div className="notice notice-error">{error}</div>}
          </div>

          <footer className="drawer-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || reminderInvalid}>
              {submitting ? "Saving..." : editing ? "Save changes" : "Create task"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}