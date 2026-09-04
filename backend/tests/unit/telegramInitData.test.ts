import { describe, expect, it } from "vitest";
import { validateTelegramInitData } from "../../src/auth/telegramInitData";
import { createSignedInitData } from "../helpers/initData";

const botToken = "123456:unit-test-token";
const now = new Date("2026-09-04T12:00:00.000Z");
const nowSeconds = Math.floor(now.getTime() / 1000);

describe("validateTelegramInitData", () => {
  it("validates a signed initData payload and returns a string Telegram user id", () => {
    const rawInitData = createSignedInitData({
      botToken,
      userId: 123456789,
      authDate: nowSeconds
    });

    expect(
      validateTelegramInitData(rawInitData, {
        botToken,
        maxAgeSeconds: 86400,
        now
      })
    ).toMatchObject({ telegramUserId: "123456789", firstName: "Test" });
  });

  it("rejects tampered initData", () => {
    const rawInitData = createSignedInitData({
      botToken,
      userId: 123456789,
      authDate: nowSeconds
    }).replace("Test", "Other");

    expect(() =>
      validateTelegramInitData(rawInitData, {
        botToken,
        maxAgeSeconds: 86400,
        now
      })
    ).toThrow("Telegram authentication failed");
  });

  it("rejects expired auth_date", () => {
    const rawInitData = createSignedInitData({
      botToken,
      userId: 123456789,
      authDate: nowSeconds - 90000
    });

    expect(() =>
      validateTelegramInitData(rawInitData, {
        botToken,
        maxAgeSeconds: 86400,
        now
      })
    ).toThrow("Telegram authentication failed");
  });

  it("rejects missing user id", () => {
    const params = new URLSearchParams({
      auth_date: String(nowSeconds),
      user: JSON.stringify({ first_name: "No id" })
    });
    const rawInitData = createSignedInitData({
      botToken,
      userId: 1,
      authDate: nowSeconds
    });
    params.set("hash", new URLSearchParams(rawInitData).get("hash") ?? "");

    expect(() =>
      validateTelegramInitData(params.toString(), {
        botToken,
        maxAgeSeconds: 86400,
        now
      })
    ).toThrow("Telegram authentication failed");
  });
});
