import request from "supertest";
import type { Telegraf } from "telegraf";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { createBot } from "../../src/bot/createBot";
import type { AppConfig } from "../../src/config/env";
import { MemoryTaskService } from "../helpers/memoryTaskService";

const webhookSecret = "test_webhook_secret-123";

const config: AppConfig = {
  NODE_ENV: "test",
  PORT: 4000,
  HOST: "0.0.0.0",
  DATABASE_URL: undefined,
  BOT_TOKEN: "123456:test-token",
  MINI_APP_URL: "https://frontend.example.com",
  CORS_ORIGIN: "https://frontend.example.com",
  BOT_MODE: "webhook",
  WEBHOOK_BASE_URL: "https://backend.example.com",
  WEBHOOK_PATH: "/telegram/webhook",
  WEBHOOK_SECRET: webhookSecret,
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: 86400,
  DEV_AUTH_ENABLED: false,
  DEV_TELEGRAM_USER_ID: ""
};

type CapturedCall = {
  method: string;
  payload: unknown;
};

type TelegramApiStub = {
  sendMessage: (chatId: number, text: string, extra?: unknown) => Promise<unknown>;
};

function buildWebhookApp() {
  const bot = createBot(config);
  if (!bot) {
    throw new Error("Expected webhook bot to be created");
  }

  const calls: CapturedCall[] = [];
  stubTelegramApi(bot, calls);

  const app = createApp({
    config,
    bot,
    taskService: new MemoryTaskService()
  });

  return { app, calls };
}

function stubTelegramApi(bot: Telegraf, calls: CapturedCall[]) {
  const botInfo = {
    id: 123456,
    is_bot: true,
    first_name: "Smart To-Do Bot",
    username: "mysmarttodooo_bot",
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false
  } as const;

  bot.botInfo = botInfo;
  (bot.context as { telegram?: TelegramApiStub }).telegram = {
    sendMessage: async (chatId, text, extra) => {
      calls.push({
        method: "sendMessage",
        payload: {
          chat_id: chatId,
          text,
          ...(typeof extra === "object" && extra !== null ? extra : {})
        }
      });
      return {
      message_id: 2,
      date: 1788523200,
      chat: { id: 555, type: "private" }
      };
    }
  };
}

function startUpdate() {
  return {
    update_id: 10_001,
    message: {
      message_id: 1,
      date: 1788523200,
      chat: {
        id: 555,
        type: "private",
        first_name: "Test"
      },
      from: {
        id: 555,
        is_bot: false,
        first_name: "Test"
      },
      text: "/start",
      entities: [
        {
          offset: 0,
          length: 6,
          type: "bot_command"
        }
      ]
    }
  };
}

describe("Telegram webhook", () => {
  it("passes POST /telegram/webhook with the correct secret to the Telegraf /start handler", async () => {
    const { app, calls } = buildWebhookApp();

    await request(app)
      .post("/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", webhookSecret)
      .send(startUpdate())
      .expect(200);

    const sendMessageCall = calls.find((call) => call.method === "sendMessage");
    expect(sendMessageCall).toBeDefined();
    expect(sendMessageCall?.payload).toMatchObject({
      chat_id: 555,
      text: expect.stringContaining("открыть свой список"),
      reply_markup: {
        inline_keyboard: [[{ text: "Открыть список задач", web_app: { url: config.MINI_APP_URL } }]]
      }
    });
  });

  it("rejects POST /telegram/webhook with the wrong secret before handling the update", async () => {
    const { app, calls } = buildWebhookApp();

    await request(app)
      .post("/telegram/webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", "wrong-secret")
      .send(startUpdate())
      .expect(404);

    expect(calls).toHaveLength(0);
  });

  it("does not handle updates posted to the wrong path", async () => {
    const { app, calls } = buildWebhookApp();

    await request(app)
      .post("/telegram/not-webhook")
      .set("X-Telegram-Bot-Api-Secret-Token", webhookSecret)
      .send(startUpdate())
      .expect(404);

    expect(calls).toHaveLength(0);
  });
});
