import cors from "cors";
import express from "express";
import helmet from "helmet";
import type { RequestHandler } from "express";
import type { Telegraf } from "telegraf";
import type { AppConfig } from "./config/env";
import { prisma } from "./lib/prisma";
import { createAuthMiddleware } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./routes/health";
import { createTaskRouter } from "./tasks/taskRoutes";
import { PrismaTaskService, type TaskService } from "./tasks/taskService";

export type CreateAppOptions = {
  config: AppConfig;
  taskService?: TaskService;
  authMiddleware?: RequestHandler;
  bot?: Telegraf | null;
};

export function createApp({ config, taskService, authMiddleware, bot }: CreateAppOptions) {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.NODE_ENV === "production" ? config.CORS_ORIGIN || false : true
    })
  );
  app.use(express.json({ limit: "64kb" }));

  app.use("/api", healthRouter);
  app.use(
    "/api",
    createTaskRouter(
      taskService ?? new PrismaTaskService(prisma),
      authMiddleware ?? createAuthMiddleware(config)
    )
  );

  if (bot && config.BOT_MODE === "webhook") {
    app.use(
      bot.webhookCallback(config.WEBHOOK_PATH, {
        secretToken: config.WEBHOOK_SECRET
      })
    );
  }

  app.use(errorHandler);

  return app;
}
