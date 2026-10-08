import { useEffect, useState, type FormEvent } from "react";
import { MAX_REMINDER, MIN_REMINDER, ReminderPicker } from "./ReminderPicker";
import type { TaskInput } from "./types";
import { formatMinutes, minutesUntil, toLocalInputValue } from "./utils";

interface Props {
  onClose: () => void;
  onCreate: (input: TaskInput) => Promise<void>;
}

export function TaskForm({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [deadline, setDeadline] = useState("");
  const [remindBefore, setRemindBefore] = useState(1440);
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
  const reminderInvalid =
    !Number.isFinite(remindBefore) || remindBefore < MIN_REMINDER || remindBefore > MAX_REMINDER;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({
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
            <h2 id="drawer-title">New task</h2>
            <p className="muted">Assign work and choose when the assignee is reminded.</p>
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
                min={toLocalInputValue(new Date())}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </label>

            <div className="field">
              <span>Remind assignee</span>
              <ReminderPicker value={remindBefore} onChange={setRemindBefore} />
            </div>

            {windowTooLong && untilDeadline !== null && (
              <div className="notice">
                The deadline is only {formatMinutes(untilDeadline)} away, which is shorter than the{" "}
                {formatMinutes(remindBefore)} reminder window. The reminder email will be sent
                immediately after the task is created.
              </div>
            )}

            {error && <div className="notice notice-error">{error}</div>}
          </div>

          <footer className="drawer-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || reminderInvalid}>
              {submitting ? "Creating..." : "Create task"}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}