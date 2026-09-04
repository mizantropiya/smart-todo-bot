import type { RequestHandler } from "express";
import type { AppConfig } from "../config/env";
import { unauthorizedError } from "../lib/errors";
import { validateTelegramInitData } from "../auth/telegramInitData";

const AUTH_PREFIX = "tma ";

export function createAuthMiddleware(config: AppConfig): RequestHandler {
  return (req, _res, next) => {
    try {
      const devUserId = req.header("X-Dev-Telegram-User-Id");
      if (config.NODE_ENV === "development" && config.DEV_AUTH_ENABLED && devUserId) {
        req.authUser = { telegramUserId: devUserId };
        next();
        return;
      }

      const authorization = req.header("Authorization");
      if (!authorization?.startsWith(AUTH_PREFIX)) {
        throw unauthorizedError();
      }

      const rawInitData = authorization.slice(AUTH_PREFIX.length).trim();
      if (!config.BOT_TOKEN) {
        throw unauthorizedError();
      }

      req.authUser = validateTelegramInitData(rawInitData, {
        botToken: config.BOT_TOKEN,
        maxAgeSeconds: config.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}
