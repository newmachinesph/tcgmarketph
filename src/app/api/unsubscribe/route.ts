import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { verifyUnsubToken } from "@/lib/unsub-token";
import { getUserEmailPrefs, DEFAULT_PREFS } from "@/lib/email-prefs";

const BASE = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${BASE}/unsubscribe?status=invalid`);
  }

  const result = verifyUnsubToken(token);
  if (!result) {
    return NextResponse.redirect(`${BASE}/unsubscribe?status=invalid`);
  }

  const { userId, category } = result;
  const current = await getUserEmailPrefs(userId);
  await db
    .update(userTable)
    .set({ emailPrefs: { ...DEFAULT_PREFS, ...current, [category]: false } })
    .where(eq(userTable.id, userId));

  return NextResponse.redirect(`${BASE}/unsubscribe?status=success&category=${category}`);
}
