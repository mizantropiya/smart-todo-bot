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
