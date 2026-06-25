import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, desc, isNull, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/db/schema/notifications";

// GET /api/notifications — list (unread first), returns unreadCount
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;

  const [rows, unreadRows] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, uid))
      .orderBy(isNull(notifications.readAt), desc(notifications.createdAt))
      .limit(50),
    db
      .select({ n: count(notifications.id) })
      .from(notifications)
      .where(and(eq(notifications.userId, uid), isNull(notifications.readAt))),
  ]);

  return NextResponse.json({
    notifications: rows,
    unreadCount:   unreadRows[0]?.n ?? 0,
  });
}
