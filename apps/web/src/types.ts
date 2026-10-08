export type TaskStatus = "pending" | "completed";

export interface Task {
  id: number;
  title: string;
  description: string;
  assignee_email: string;
  deadline: string;
  status: TaskStatus;
  notification_sent: boolean;
  remind_before_minutes: number;
  remind_at: string;
  created_at: string;
}

export interface TaskInput {
  title: string;
  description: string;
  assignee_email: string;
  deadline: string;
  remind_before_minutes: number;
}