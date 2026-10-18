import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, gte, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { listings } from "@/db/schema/listings";
import { transactions } from "@/db/schema/transactions";
import { reports } from "@/db/schema/reports";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    [{ totalUsers }],
    [{ activeListings }],
    [{ openReports }],
    [{ txnsThisWeek }],
    [{ bannedUsers }],
  ] = await Promise.all([
    db.select({ totalUsers:     count(userTable.id) }).from(userTable),
    db.select({ activeListings: count(listings.id)  }).from(listings).where(eq(listings.status, "active")),
    db.select({ openReports:    count(reports.id)   }).from(reports).where(eq(reports.status, "open")),
    db.select({ txnsThisWeek:   count(transactions.id) }).from(transactions).where(gte(transactions.createdAt, weekAgo)),
    db.select({ bannedUsers:    count(userTable.id) }).from(userTable).where(eq(userTable.isBanned, true)),
  ]);

  return NextResponse.json({
    totalUsers:     Number(totalUsers),
    activeListings: Number(activeListings),
    openReports:    Number(openReports),
    txnsThisWeek:   Number(txnsThisWeek),
    bannedUsers:    Number(bannedUsers),
  });
}
