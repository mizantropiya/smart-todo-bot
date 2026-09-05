import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import type { AppConfig } from "../../src/config/env";
import { createAuthMiddleware } from "../../src/middleware/auth";
import { MAX_TASKS_PER_USER, MAX_TASK_TEXT_LENGTH } from "../../src/tasks/constants";
import { MemoryTaskService } from "../helpers/memoryTaskService";

const config: AppConfig = {
  NODE_ENV: "development",
  PORT: 4000,
  HOST: "0.0.0.0",
  DATABASE_URL: undefined,
  BOT_TOKEN: undefined,
  MINI_APP_URL: "",
  CORS_ORIGIN: "http://localhost:5173",
  BOT_MODE: "disabled",
  WEBHOOK_BASE_URL: "",
  WEBHOOK_PATH: "/telegram/webhook",
  WEBHOOK_SECRET: "",
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: 86400,
  DEV_AUTH_ENABLED: true,
  DEV_TELEGRAM_USER_ID: ""
};

function makeApp() {
  return createApp({
    config,
    taskService: new MemoryTaskService(),
    authMiddleware: createAuthMiddleware(config)
  });
}

describe("task API", () => {
  it("returns health without authentication", async () => {
    await request(makeApp()).get("/api/health").expect(200, { status: "ok" });
  });

  it("requires authentication for tasks", async () => {
    const response = await request(makeApp()).get("/api/tasks").expect(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("does not allow dev auth in production", async () => {
    const app = createApp({
      config: {
        ...config,
        NODE_ENV: "production",
        DEV_AUTH_ENABLED: true,
        BOT_TOKEN: "123456:integration-token"
      },
      taskService: new MemoryTaskService(),
      authMiddleware: createAuthMiddleware({
        ...config,
        NODE_ENV: "production",
        DEV_AUTH_ENABLED: true,
        BOT_TOKEN: "123456:integration-token"
      })
    });

    const response = await request(app)
      .get("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .expect(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("creates, lists, toggles and deletes a task for the authenticated user", async () => {
    const app = makeApp();

    const created = await request(app)
      .post("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ text: "Купить продукты" })
      .expect(201);

    expect(created.body).toMatchObject({
      text: "Купить продукты",
      completed: false
    });
    expect(created.body.telegramUserId).toBeUndefined();

    const listed = await request(app)
      .get("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .expect(200);
    expect(listed.body).toHaveLength(1);

    const toggled = await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ completed: true })
      .expect(200);
    expect(toggled.body.completed).toBe(true);

    await request(app)
      .delete(`/api/tasks/${created.body.id}`)
      .set("X-Dev-Telegram-User-Id", "user-a")
      .expect(204);

    const empty = await request(app)
      .get("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .expect(200);
    expect(empty.body).toHaveLength(0);
  });

  it("prevents a user from listing, patching or deleting another user's tasks", async () => {
    const app = makeApp();

    const created = await request(app)
      .post("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ text: "Private task" })
      .expect(201);

    const userBList = await request(app)
      .get("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-b")
      .expect(200);
    expect(userBList.body).toHaveLength(0);

    await request(app)
      .patch(`/api/tasks/${created.body.id}`)
      .set("X-Dev-Telegram-User-Id", "user-b")
      .send({ completed: true })
      .expect(404);

    await request(app)
      .delete(`/api/tasks/${created.body.id}`)
      .set("X-Dev-Telegram-User-Id", "user-b")
      .expect(404);
  });

  it("validates UUID params and task text", async () => {
    const app = makeApp();

    await request(app)
      .post("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ text: "" })
      .expect(400);

    await request(app)
      .post("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ text: "   " })
      .expect(400);

    await request(app)
      .post("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ text: "а".repeat(MAX_TASK_TEXT_LENGTH + 1) })
      .expect(400);

    await request(app)
      .patch("/api/tasks/not-a-uuid")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ completed: true })
      .expect(400);
  });

  it("accepts task text up to 160 characters", async () => {
    const app = makeApp();
    const text = "а".repeat(MAX_TASK_TEXT_LENGTH);

    const response = await request(app)
      .post("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ text })
      .expect(201);

    expect(response.body.text).toBe(text);
  });

  it("enforces the 99 task limit per authenticated user", async () => {
    const app = makeApp();

    for (let index = 1; index < MAX_TASKS_PER_USER; index += 1) {
      await request(app)
        .post("/api/tasks")
        .set("X-Dev-Telegram-User-Id", "user-a")
        .send({ text: `Task ${index}` })
        .expect(201);
    }

    await request(app)
      .post("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ text: "Task 99" })
      .expect(201);

    const limitResponse = await request(app)
      .post("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ text: "Task 100" })
      .expect(409);

    expect(limitResponse.body.error).toEqual({
      code: "TASK_LIMIT_REACHED",
      message: "Достигнут лимит в 99 задач"
    });

    await request(app)
      .post("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-b")
      .send({ text: "Other user task" })
      .expect(201);
  });

  it("allows creating again after a task is deleted below the limit", async () => {
    const app = makeApp();

    for (let index = 1; index <= MAX_TASKS_PER_USER; index += 1) {
      await request(app)
        .post("/api/tasks")
        .set("X-Dev-Telegram-User-Id", "user-a")
        .send({ text: `Task ${index}` })
        .expect(201);
    }

    const listed = await request(app)
      .get("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .expect(200);

    await request(app)
      .delete(`/api/tasks/${listed.body[0].id}`)
      .set("X-Dev-Telegram-User-Id", "user-a")
      .expect(204);

    await request(app)
      .post("/api/tasks")
      .set("X-Dev-Telegram-User-Id", "user-a")
      .send({ text: "Replacement task" })
      .expect(201);
  });
});
