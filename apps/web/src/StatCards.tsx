import type { Task } from "./types";
import { displayStatus, type DisplayStatus } from "./utils";

export function StatCards({ tasks }: { tasks: Task[] }) {
  const statuses = tasks.map(displayStatus);
  const count = (s: DisplayStatus) => statuses.filter((x) => x === s).length;

  const cards = [
    { label: "Total tasks", value: tasks.length, tone: "neutral" },
    { label: "Open", value: tasks.length - count("completed"), tone: "info" },
    { label: "Due within 24h", value: count("due-soon"), tone: "warn" },
    { label: "Overdue", value: count("overdue"), tone: "danger" },
    { label: "Completed", value: count("completed"), tone: "success" },
  ];

  return (
    <section className="stats">
      {cards.map((c) => (
        <div key={c.label} className={`stat stat-${c.tone}`}>
          <span className="stat-label">{c.label}</span>
          <span className="stat-value">{c.value}</span>
        </div>
      ))}
    </section>
  );
}