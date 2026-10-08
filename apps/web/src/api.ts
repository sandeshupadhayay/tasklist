import type {Task, TaskInput} from './types';

const BASE= import.meta.env.VITE_API_URL?? "/api";

function formatError(detail:unknown, status:number):string{
    if (Array.isArray(detail)){
        return detail.map((d)=>(typeof d === "object" && d && "msg" in d? String(d.msg) : String(d))).join(", ");
    }
    if (typeof detail ==="string") return detail;
    return `request failed (${status})`; 
}


async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(formatError(body?.detail, res.status));
  }
  return res.json() as Promise<T>;
}


export const api = {
  listTasks: () => request<Task[]>("/tasks"),
  createTask: (input: TaskInput) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(input) }),
  completeTask: (id: number) =>
    request<Task>(`/tasks/${id}/complete`, { method: "PATCH" }),
};