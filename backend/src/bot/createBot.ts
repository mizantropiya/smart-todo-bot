import { Telegraf } from "telegraf";
import type { AppConfig } from "../config/env";

export function createBot(config: AppConfig): Telegraf | null {
  if (config.BOT_MODE === "disabled") {
    return null;
  }

  if (!config.BOT_TOKEN || !config.MINI_APP_URL) {
    throw new Error("BOT_TOKEN and MINI_APP_URL are required to create the bot");
  }

  const bot = new Telegraf(config.BOT_TOKEN);

  bot.start(async (ctx) => {
    await ctx.reply("Привет! 👋\n\nЯ помогу тебе управлять списком задач.\n\nНажми кнопку ниже, чтобы открыть свой список.", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Открыть список задач",
              web_app: { url: config.MINI_APP_URL as string }
            }
          ]
        ]
      }
    });
  });

  return bot;
}

export async function startBot(bot: Telegraf | null, config: AppConfig): Promise<void> {
  if (!bot || config.BOT_MODE === "disabled") {
    console.log("Telegram bot disabled");
    return;
  }

  if (config.BOT_MODE === "polling") {
    await bot.launch();
    console.log("Telegram bot started in polling mode");
    return;
  }

  if (!config.WEBHOOK_BASE_URL || !config.WEBHOOK_SECRET) {
    throw new Error("WEBHOOK_BASE_URL and WEBHOOK_SECRET are required for webhook mode");
  }

  const webhookUrl = new URL(config.WEBHOOK_PATH, config.WEBHOOK_BASE_URL).toString();
  await bot.telegram.setWebhook(webhookUrl, {
    secret_token: config.WEBHOOK_SECRET
  });
  console.log(`Telegram bot webhook configured at ${webhookUrl}`);
}
