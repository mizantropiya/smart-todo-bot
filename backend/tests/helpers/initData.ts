import crypto from "node:crypto";

export function createSignedInitData(input: {
  botToken: string;
  userId: string | number;
  authDate: number;
  extra?: Record<string, string>;
}) {
  const params = new URLSearchParams({
    auth_date: String(input.authDate),
    user: JSON.stringify({ id: input.userId, first_name: "Test" }),
    ...(input.extra ?? {})
  });

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(input.botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);

  return params.toString();
}
