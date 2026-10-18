import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type DayRow = { date: string; count: number };

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rangeDays = Math.min(90, Math.max(7, parseInt(request.nextUrl.searchParams.get("range") ?? "30", 10)));
  const since     = new Date(Date.now() - rangeDays * 86_400_000);

  const rows = (r: { rows: Record<string, unknown>[] }): DayRow[] =>
    r.rows.map((x) => ({ date: String(x["date"]), count: Number(x["count"]) }));

  const [newUsers, newListings, completedTxns, filedReports] = await Promise.all([
    db.execute(sql`
      SELECT DATE_TRUNC('day', created_at)::date AS date, COUNT(*)::int AS count
      FROM "user"
      WHERE created_at >= ${since}
      GROUP BY date ORDER BY date
    `).then(rows),

    db.execute(sql`
      SELECT DATE_TRUNC('day', created_at)::date AS date, COUNT(*)::int AS count
      FROM "listings"
      WHERE created_at >= ${since}
      GROUP BY date ORDER BY date
    `).then(rows),

    db.execute(sql`
      SELECT DATE_TRUNC('day', updated_at)::date AS date, COUNT(*)::int AS count
      FROM "transactions"
      WHERE updated_at >= ${since} AND status = 'completed'
      GROUP BY date ORDER BY date
    `).then(rows),

    db.execute(sql`
      SELECT DATE_TRUNC('day', created_at)::date AS date, COUNT(*)::int AS count
      FROM "reports"
      WHERE created_at >= ${since}
      GROUP BY date ORDER BY date
    `).then(rows),
  ]);

  return NextResponse.json({ newUsers, newListings, completedTxns, filedReports, rangeDays });
}
