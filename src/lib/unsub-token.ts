import { createHmac, timingSafeEqual } from "crypto";
import type { PrefCategory } from "./email-prefs";

const SECRET   = process.env.BETTER_AUTH_SECRET ?? "change-me";
const VALID_CATS: PrefCategory[] = ["offers", "messages", "wishlist", "transactions"];

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function generateUnsubToken(userId: string, category: PrefCategory): string {
  const payload = `${userId}:${category}`;
  return Buffer.from(`${payload}:${sign(payload)}`).toString("base64url");
}

export function verifyUnsubToken(token: string): { userId: string; category: PrefCategory } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return null;
    const payload  = decoded.slice(0, lastColon);
    const sig      = decoded.slice(lastColon + 1);
    const expected = sign(payload);
    const sigBuf   = Buffer.from(sig);
    const expBuf   = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const sep      = payload.indexOf(":");
    const userId   = payload.slice(0, sep);
    const category = payload.slice(sep + 1) as PrefCategory;
    if (!userId || !VALID_CATS.includes(category)) return null;
    return { userId, category };
  } catch {
    return null;
  }
}
