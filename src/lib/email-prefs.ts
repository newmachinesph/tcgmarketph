import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { DEFAULT_PREFS } from "./email-prefs-shared";

export type { PrefCategory, EmailPrefs } from "./email-prefs-shared";
export { DEFAULT_PREFS, PREF_LABELS } from "./email-prefs-shared";

export async function getUserEmailPrefs(userId: string) {
  const [row] = await db
    .select({ emailPrefs: userTable.emailPrefs })
    .from(userTable)
    .where(eq(userTable.id, userId));
  return { ...DEFAULT_PREFS, ...(row?.emailPrefs ?? {}) };
}
