import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { transactions } from "@/db/schema/transactions";
import { reports } from "@/db/schema/reports";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [profile] = await db
    .select({
      id:              userTable.id,
      name:            userTable.name,
      displayName:     userTable.displayName,
      email:           userTable.email,
      image:           userTable.image,
      isBanned:        userTable.isBanned,
      bannedReason:    userTable.bannedReason,
      isAdmin:         userTable.isAdmin,
      reputationScore: userTable.reputationScore,
      noShowCount:     userTable.noShowCount,
      phoneVerified:   userTable.phoneVerified,
      createdAt:       userTable.createdAt,
    })
    .from(userTable)
    .where(eq(userTable.id, id));

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const recentTransactions = await db
    .select({
      id:        transactions.id,
      status:    transactions.status,
      buyerId:   transactions.buyerId,
      sellerId:  transactions.sellerId,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(eq(transactions.buyerId, id))
    .orderBy(desc(transactions.createdAt))
    .limit(20);

  const reportsAgainst = await db
    .select()
    .from(reports)
    .where(eq(reports.targetId, id))
    .orderBy(desc(reports.createdAt))
    .limit(20);

  return NextResponse.json({ user: profile, transactions: recentTransactions, reports: reportsAgainst });
}
