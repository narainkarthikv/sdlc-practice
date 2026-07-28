import type {
  ProductivitySummaryResponse,
  SummaryPeriod,
  Task,
  TaskInput,
  TaskSummaryResponse
} from "./types";
import { agentBaseUrl, apiBaseUrl } from "./runtimeConfig";

function requireJsonBody<T extends object>(payload: T | undefined, action: string): T {
  if (!payload || typeof payload !== "object") {
    throw new Error(`${action} payload is required`);
  }

  return payload;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

function buildUserHeaders(userId: string) {
  return {
    "x-user-id": userId
  };
}

export function fetchTasks(userId: string): Promise<Task[]> {
  return requestJson<Task[]>(`${apiBaseUrl}/tasks`, {
    headers: buildUserHeaders(userId)
  });
}

export function createTask(userId: string, payload: TaskInput): Promise<Task> {
  return requestJson<Task>(`${apiBaseUrl}/tasks`, {
    method: "POST",
    headers: buildUserHeaders(userId),
    body: JSON.stringify(requireJsonBody(payload, "Create task"))
  });
}

export function updateTask(userId: string, id: string, payload: Partial<TaskInput>): Promise<Task> {
  return requestJson<Task>(`${apiBaseUrl}/tasks/${id}`, {
    method: "PATCH",
    headers: buildUserHeaders(userId),
    body: JSON.stringify(requireJsonBody(payload, "Update task"))
  });
}

export function deleteTask(userId: string, id: string): Promise<void> {
  return requestJson<void>(`${apiBaseUrl}/tasks/${id}`, {
    method: "DELETE",
    headers: buildUserHeaders(userId)
  });
}

export function fetchProductivitySummary(
  period: SummaryPeriod,
  tasks: Task[]
): Promise<ProductivitySummaryResponse> {
  return requestJson<ProductivitySummaryResponse>(`${agentBaseUrl}/v1/summaries/productivity`, {
    method: "POST",
    body: JSON.stringify({ period, tasks: requireJsonBody(tasks, "Productivity summary tasks") })
  });
}

export function fetchTaskSummary(tasks: Task[]): Promise<TaskSummaryResponse> {
  return requestJson<TaskSummaryResponse>(`${agentBaseUrl}/v1/summaries/tasks`, {
    method: "POST",
    body: JSON.stringify({ tasks: requireJsonBody(tasks, "Task summary tasks") })
  });
}
