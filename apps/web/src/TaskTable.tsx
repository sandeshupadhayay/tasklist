import { useState } from "react";
import type { Task } from "./types";
import { STATUS_LABEL, displayStatus, formatDateTime, formatMinutes, timeLeft } from "./utils";

interface Props {
  tasks: Task[];
  onComplete: (id: number) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function reminderNote(task: Task): string {
  if (task.notification_sent) return "Sent";
  if (task.status === "completed") return "Not sent";
  return `Scheduled ${formatDateTime(task.remind_at)}`;
}

export function TaskTable({ tasks, onComplete, onEdit, onDelete }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);

  async function handleComplete(id: number) {
    setBusyId(id);
    try {
      await onComplete(id);
    } finally {
      setBusyId(null);
    }
  }

  if (tasks.length === 0) {
    return <div className="empty">No tasks match this view.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Assignee</th>
            <th>Deadline</th>
            <th>Reminder</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const status = displayStatus(t);
            const done = t.status === "completed";
            return (
              <tr key={t.id} className={done ? "row-done" : ""}>
                <td className="col-task">
                  <div className="cell-title">{t.title}</div>
                  {t.description && <div className="cell-sub clamp">{t.description}</div>}
                </td>
                <td>{t.assignee_email}</td>
                <td>
                  <div>{formatDateTime(t.deadline)}</div>
                  <div className={status === "overdue" ? "cell-sub text-danger" : "cell-sub"}>
                    {done ? "Completed" : timeLeft(t.deadline)}
                  </div>
                </td>
                <td>
                  <div>{formatMinutes(t.remind_before_minutes)} before</div>
                  <div className="cell-sub">{reminderNote(t)}</div>
                </td>
                <td>
                  <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>
                </td>
                <td className="col-action">
                  <div className="actions">
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={done || busyId === t.id}
                      onClick={() => handleComplete(t.id)}
                    >
                      {done ? "Done" : busyId === t.id ? "Saving..." : "Mark complete"}
                    </button>
                    <button className="btn btn-outline btn-sm" disabled={done} onClick={() => onEdit(t)}>
                      Edit
                    </button>
                    <button className="btn btn-danger-outline btn-sm" onClick={() => onDelete(t)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}