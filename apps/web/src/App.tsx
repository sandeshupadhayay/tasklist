import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { StatCards } from "./StatCards";
import { TaskForm } from "./TaskForm";
import { TaskTable } from "./TaskTable";
import type { Task, TaskInput } from "./types";
import { displayStatus } from "./utils";
import "./index.css";

type Filter = "all" | "open" | "due-soon" | "overdue" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "due-soon", label: "Due soon" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
];

function matches(task: Task, filter: Filter): boolean {
  const status = displayStatus(task);
  if (filter === "all") return true;
  if (filter === "open") return status !== "completed";
  return status === filter;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      setTasks(await api.listTasks());
      setError(null);
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 30_000); // keep statuses and reminder flags fresh
    return () => clearInterval(id);
  }, [load]);

  async function handleCreate(input: TaskInput) {
    await api.createTask(input); // errors bubble up to the form
    await load();
  }

  async function handleComplete(id: number) {
    try {
      await api.completeTask(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete task");
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => matches(t, filter))
      .filter(
        (t) =>
          !q ||
          [t.title, t.description, t.assignee_email].some((f) => f.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          Number(a.status === "completed") - Number(b.status === "completed") ||
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      );
  }, [tasks, filter, query]);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">T</span>
          <span className="brand-name">TaskList</span>
        </div>
        <div className="topbar-right">
          {updatedAt && (
            <span className="topbar-meta">
              Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button className="btn btn-topbar" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </header>

      <main className="page">
        <div className="page-head">
          <div>
            <h1>Tasks</h1>
            <p className="muted">Track assignments, deadlines and reminder status in one place.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setDrawerOpen(true)}>
            + New task
          </button>
        </div>

        <StatCards tasks={tasks} />

        {error && <div className="notice notice-error">{error}</div>}

        <section className="panel">
          <div className="toolbar">
            <nav className="tabs" aria-label="Task filters">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={filter === f.key ? "tab active" : "tab"}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                  <span className="tab-count">{tasks.filter((t) => matches(t, f.key)).length}</span>
                </button>
              ))}
            </nav>
            <input
              className="search"
              type="search"
              placeholder="Search title, description or assignee"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="empty">Loading tasks...</div>
          ) : (
            <TaskTable tasks={visible} onComplete={handleComplete} />
          )}
        </section>
      </main>

      {drawerOpen && <TaskForm onClose={() => setDrawerOpen(false)} onCreate={handleCreate} />}
    </div>
  );
}