import crypto from "node:crypto";
import { z } from "zod";
import { unauthorizedError } from "../lib/errors";

const MAX_CLOCK_SKEW_SECONDS = 60;

const telegramUserSchema = z.object({
  id: z.union([z.number().int(), z.string().min(1)]),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional()
});

export type AuthenticatedTelegramUser = {
  telegramUserId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
};

export type ValidateInitDataOptions = {
  botToken: string;
  maxAgeSeconds: number;
  now?: Date;
};

export function validateTelegramInitData(
  rawInitData: string,
  options: ValidateInitDataOptions
): AuthenticatedTelegramUser {
  if (!rawInitData || !options.botToken) {
    throw unauthorizedError();
  }

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(rawInitData);
  } catch {
    throw unauthorizedError();
  }

  const hash = params.get("hash");
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) {
    throw unauthorizedError();
  }

  const seenKeys = new Set<string>();
  for (const key of params.keys()) {
    if (seenKeys.has(key)) {
      throw unauthorizedError();
    }
    seenKeys.add(key);
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(options.botToken).digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (!safeCompareHex(hash, calculatedHash)) {
    throw unauthorizedError();
  }

  const authDate = parseUnixTimestamp(params.get("auth_date"));
  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  if (
    authDate === null ||
    authDate > nowSeconds + MAX_CLOCK_SKEW_SECONDS ||
    nowSeconds - authDate > options.maxAgeSeconds
  ) {
    throw unauthorizedError();
  }

  const rawUser = params.get("user");
  if (!rawUser) {
    throw unauthorizedError();
  }

  try {
    const parsedUser = telegramUserSchema.parse(JSON.parse(rawUser));
    return {
      telegramUserId: String(parsedUser.id),
      firstName: parsedUser.first_name,
      lastName: parsedUser.last_name,
      username: parsedUser.username,
      languageCode: parsedUser.language_code
    };
  } catch {
    throw unauthorizedError();
  }
}

function parseUnixTimestamp(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function safeCompareHex(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}
