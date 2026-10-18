import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, or, desc, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/db/schema/transactions";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user as userTable } from "@/db/schema/auth";

// GET /api/admin/disputes — all unresolved no_show or disputed transactions
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({
      transaction: transactions,
      card:        { name: cardCatalog.name, imageUrl: cardCatalog.imageUrl },
    })
    .from(transactions)
    .innerJoin(listings,     eq(transactions.listingId, listings.id))
    .innerJoin(cardCatalog,  eq(listings.cardId, cardCatalog.id))
    .where(
      or(
        eq(transactions.status, "no_show"),
        eq(transactions.status, "disputed"),
      )
    )
    .orderBy(desc(transactions.updatedAt));

  if (rows.length === 0) return NextResponse.json({ disputes: [] });

  // Batch-load buyers and sellers
  const userIds = [...new Set(rows.flatMap((r) => [r.transaction.buyerId, r.transaction.sellerId]))];
  const users = await db
    .select({
      id:              userTable.id,
      name:            userTable.name,
      displayName:     userTable.displayName,
      email:           userTable.email,
      noShowCount:     userTable.noShowCount,
      reputationScore: userTable.reputationScore,
    })
    .from(userTable)
    .where(or(...userIds.map((id) => eq(userTable.id, id))));

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const disputes = rows.map(({ transaction: t, card }) => ({
    id:          t.id,
    status:      t.status,
    agreedPrice: t.agreedPrice,
    resolvedAt:  t.resolvedAt,
    resolvedBy:  t.resolvedBy,
    adminNote:   t.adminNote,
    createdAt:   t.createdAt,
    updatedAt:   t.updatedAt,
    card,
    buyer:  userMap[t.buyerId]  ?? null,
    seller: userMap[t.sellerId] ?? null,
  }));

  return NextResponse.json({ disputes });
}
