export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export const unauthorizedError = () =>
  new HttpError(401, "UNAUTHORIZED", "Telegram authentication failed");

export const notFoundError = () => new HttpError(404, "NOT_FOUND", "Task not found");

export const taskLimitReachedError = () =>
  new HttpError(409, "TASK_LIMIT_REACHED", "Достигнут лимит в 99 задач");
