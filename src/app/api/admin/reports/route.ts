import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc, inArray, or, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { reports } from "@/db/schema/reports";
import { user as userTable } from "@/db/schema/auth";

// GET /api/admin/reports?status=open — paginated report queue
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const validStatuses = ["open", "reviewing", "resolved", "dismissed"] as const;
  type Status = typeof validStatuses[number];

  const rows = await db
    .select()
    .from(reports)
    .where(
      status && validStatuses.includes(status as Status)
        ? eq(reports.status, status as Status)
        : undefined
    )
    .orderBy(desc(reports.createdAt))
    .limit(100);

  // Fetch reporter + resolver user info and open report counts in parallel
  const userIds = [
    ...new Set([
      ...rows.map((r) => r.reporterId),
      ...rows.map((r) => r.resolvedBy).filter(Boolean) as string[],
    ]),
  ];

  const [users, openCounts] = await Promise.all([
    userIds.length
      ? db
          .select({ id: userTable.id, name: userTable.name, displayName: userTable.displayName, email: userTable.email })
          .from(userTable)
          .where(inArray(userTable.id, userIds))
      : Promise.resolve([]),
    // Count unresolved (open + reviewing) reports per target across all reports
    db
      .select({ targetType: reports.targetType, targetId: reports.targetId, cnt: count() })
      .from(reports)
      .where(or(eq(reports.status, "open"), eq(reports.status, "reviewing")))
      .groupBy(reports.targetType, reports.targetId),
  ]);

  const userMap     = Object.fromEntries(users.map((u) => [u.id, u]));
  const countMap    = Object.fromEntries(openCounts.map((c) => [`${c.targetType}:${c.targetId}`, c.cnt]));

  const enriched = rows.map((r) => ({
    ...r,
    reporter:  userMap[r.reporterId] ?? null,
    resolver:  r.resolvedBy ? (userMap[r.resolvedBy] ?? null) : null,
    openCount: countMap[`${r.targetType}:${r.targetId}`] ?? 0,
  }));

  return NextResponse.json({ reports: enriched });
}
