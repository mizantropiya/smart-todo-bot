import "dotenv/config";
import { z } from "zod";

const booleanFromString = z
  .string()
  .optional()
  .default("false")
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  BOT_TOKEN: z.string().optional(),
  BOT_USERNAME: z.string().default("mysmarttodooo_bot"),
  MINI_APP_URL: z.string().url().optional().or(z.literal("")),
  CORS_ORIGIN: z.string().optional().or(z.literal("")),
  BOT_MODE: z.enum(["disabled", "polling", "webhook"]).default("disabled"),
  WEBHOOK_BASE_URL: z.string().url().optional().or(z.literal("")),
  WEBHOOK_PATH: z.string().regex(/^\/[A-Za-z0-9/_-]*$/).default("/telegram/webhook"),
  WEBHOOK_SECRET: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,256}$/)
    .optional()
    .or(z.literal("")),
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(86400),
  DEV_AUTH_ENABLED: booleanFromString,
  DEV_TELEGRAM_USER_ID: z.string().optional().or(z.literal(""))
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const config = envSchema.parse(env);

  if (config.BOT_MODE !== "disabled") {
    if (!config.BOT_TOKEN) {
      throw new Error("BOT_TOKEN is required when BOT_MODE is polling or webhook");
    }
    if (!config.MINI_APP_URL) {
      throw new Error("MINI_APP_URL is required when BOT_MODE is polling or webhook");
    }
  }

  if (config.BOT_MODE === "webhook") {
    if (!config.WEBHOOK_BASE_URL) {
      throw new Error("WEBHOOK_BASE_URL is required when BOT_MODE=webhook");
    }
    if (!config.WEBHOOK_SECRET) {
      throw new Error("WEBHOOK_SECRET is required when BOT_MODE=webhook");
    }
  }

  return config;
}
