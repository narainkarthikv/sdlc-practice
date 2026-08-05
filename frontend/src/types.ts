export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type SummaryPeriod = "day" | "week" | "month" | "year";

export type Task = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
};

export type ProductivitySummaryResponse = {
  period: SummaryPeriod;
  summary: string;
  highlights: string[];
  risks: string[];
  nextSteps: string[];
};

export type TaskSummaryResponse = {
  summary: string;
  breakdown: Record<TaskStatus, number>;
  blockers: string[];
  recommendations: string[];
};

export type AuthUser = {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  user: AuthUser;
  sessionId: string;
  expiresAt: string;
};

export type SignupInput = {
  displayName: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
