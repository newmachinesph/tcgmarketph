import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { user, session as sessionTable } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

interface EmailChangeRecord {
  userId: string;
  newEmail: string;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";

  if (!token) {
    return NextResponse.redirect(new URL("/settings?error=invalid_token", request.url));
  }

  const key = `email_change:${token}`;
  const raw = await redis.get<EmailChangeRecord | string>(key);

  if (!raw) {
    return NextResponse.redirect(new URL("/settings?error=expired", request.url));
  }

  const record: EmailChangeRecord =
    typeof raw === "string" ? JSON.parse(raw) : raw;

  await Promise.all([
    db.update(user).set({ email: record.newEmail }).where(eq(user.id, record.userId)),
    // Revoke all sessions so the user re-authenticates with the new email
    db.delete(sessionTable).where(eq(sessionTable.userId, record.userId)),
    redis.del(key),
  ]);

  return NextResponse.redirect(new URL("/login?message=email_changed", request.url));
}
