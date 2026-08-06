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

  if (response.status === 401) {
    window.dispatchEvent(new Event("auth:expired"));
  }

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

function buildSessionHeaders(sessionId: string) {
  return {
    "x-session-id": sessionId
  };
}

export function fetchTasks(sessionId: string): Promise<Task[]> {
  return requestJson<Task[]>(`${apiBaseUrl}/tasks`, {
    headers: buildSessionHeaders(sessionId)
  });
}

export function createTask(sessionId: string, payload: TaskInput): Promise<Task> {
  return requestJson<Task>(`${apiBaseUrl}/tasks`, {
    method: "POST",
    headers: buildSessionHeaders(sessionId),
    body: JSON.stringify(requireJsonBody(payload, "Create task"))
  });
}

export function updateTask(sessionId: string, id: string, payload: Partial<TaskInput>): Promise<Task> {
  return requestJson<Task>(`${apiBaseUrl}/tasks/${id}`, {
    method: "PATCH",
    headers: buildSessionHeaders(sessionId),
    body: JSON.stringify(requireJsonBody(payload, "Update task"))
  });
}

export function deleteTask(sessionId: string, id: string): Promise<void> {
  return requestJson<void>(`${apiBaseUrl}/tasks/${id}`, {
    method: "DELETE",
    headers: buildSessionHeaders(sessionId)
  });
}

export function deleteTasks(sessionId: string, ids: string[]): Promise<{deleted:number}> {
  return requestJson<{deleted:number}>(`${apiBaseUrl}/tasks/bulk-delete`, {
    method: "POST",
    headers: buildSessionHeaders(sessionId),
    body: JSON.stringify({ ids })
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

export function fetchTaskSummary(period: SummaryPeriod, tasks: Task[]): Promise<TaskSummaryResponse> {
  return requestJson<TaskSummaryResponse>(`${agentBaseUrl}/v1/summaries/tasks`, {
    method: "POST",
    body: JSON.stringify({ period, tasks: requireJsonBody(tasks, "Task summary tasks") })
  });
}
