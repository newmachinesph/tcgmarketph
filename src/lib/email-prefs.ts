import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import type { EmailPrefs } from "@/db/schema/auth";

export type { EmailPrefs };
export type PrefCategory = keyof EmailPrefs;

export const DEFAULT_PREFS: EmailPrefs = {
  offers:       true,
  messages:     true,
  wishlist:     true,
  transactions: true,
};

export const PREF_LABELS: Record<PrefCategory, { label: string; description: string }> = {
  offers:       { label: "Offer alerts",          description: "When someone makes, counters, or accepts an offer on your listing." },
  messages:     { label: "Message notifications",  description: "When you receive a new direct message." },
  wishlist:     { label: "Wishlist alerts",        description: "When a card on your wishlist becomes available." },
  transactions: { label: "Transaction updates",    description: "Purchase confirmations, meetup proposals, and cancellations." },
};

export async function getUserEmailPrefs(userId: string): Promise<EmailPrefs> {
  const [row] = await db
    .select({ emailPrefs: userTable.emailPrefs })
    .from(userTable)
    .where(eq(userTable.id, userId));
  return { ...DEFAULT_PREFS, ...(row?.emailPrefs ?? {}) };
}
