import type { Task } from "./types";

const apiUrl = import.meta.env.VITE_API_URL || "";

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export async function getTasks(): Promise<Task[]> {
  return request<Task[]>("/api/tasks");
}

export async function createTask(text: string): Promise<Task> {
  return request<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ text })
  });
}

export async function updateTask(id: string, completed: boolean): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ completed })
  });
}

export async function deleteTask(id: string): Promise<void> {
  await request<void>(`/api/tasks/${id}`, {
    method: "DELETE"
  });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...init.headers
    }
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => ({}))) as T | ApiErrorResponse;
  if (!response.ok) {
    const apiError = body as ApiErrorResponse;
    const message = apiError.error?.message ?? "Не удалось выполнить запрос";
    throw new ApiError(message, response.status);
  }

  return body as T;
}

function getAuthHeaders(): Record<string, string> {
  const initData = window.Telegram?.WebApp?.initData;
  if (initData) {
    return { Authorization: `tma ${initData}` };
  }

  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_DEV_AUTH_ENABLED === "true" &&
    import.meta.env.VITE_DEV_TELEGRAM_USER_ID
  ) {
    return { "X-Dev-Telegram-User-Id": import.meta.env.VITE_DEV_TELEGRAM_USER_ID };
  }

  return {};
}
