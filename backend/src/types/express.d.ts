import type { AuthenticatedTelegramUser } from "../auth/telegramInitData";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedTelegramUser;
    }
  }
}
