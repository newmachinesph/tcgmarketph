import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, avg, count, desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { transactions } from "@/db/schema/transactions";
import { ratings } from "@/db/schema/ratings";

const submitSchema = z.object({
  transactionId: z.string().min(1),
  score:         z.number().int().min(1).max(5),
  comment:       z.string().max(500).optional(),
});

// GET /api/ratings?userId=xxx — ratings received by a user (+ aggregate stats)
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const [rows, stats] = await Promise.all([
    db
      .select({
        id:        ratings.id,
        score:     ratings.score,
        comment:   ratings.comment,
        createdAt: ratings.createdAt,
        rater: {
          id:          userTable.id,
          name:        userTable.name,
          displayName: userTable.displayName,
          image:       userTable.image,
        },
      })
      .from(ratings)
      .innerJoin(userTable, eq(ratings.raterId, userTable.id))
      .where(eq(ratings.rateeId, userId))
      .orderBy(desc(ratings.createdAt))
      .limit(50),

    db
      .select({ avg: avg(ratings.score), total: count(ratings.id) })
      .from(ratings)
      .where(eq(ratings.rateeId, userId)),
  ]);

  return NextResponse.json({
    ratings:   rows,
    avgScore:  stats[0]?.avg ? parseFloat(stats[0].avg).toFixed(1) : null,
    total:     stats[0]?.total ?? 0,
  });
}

// POST /api/ratings — submit a rating
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { transactionId, score, comment } = parsed.data;
  const uid = session.user.id;

  // Load transaction
  const [txn] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId));

  if (!txn) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  if (txn.status !== "completed") {
    return NextResponse.json({ error: "Can only rate completed transactions" }, { status: 409 });
  }

  const isBuyer  = uid === txn.buyerId;
  const isSeller = uid === txn.sellerId;
  if (!isBuyer && !isSeller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rateeId = isBuyer ? txn.sellerId : txn.buyerId;

  // Check for duplicate
  const existing = await db
    .select({ id: ratings.id })
    .from(ratings)
    .where(and(eq(ratings.transactionId, transactionId), eq(ratings.raterId, uid)));

  if (existing.length > 0) {
    return NextResponse.json({ error: "You have already rated this transaction" }, { status: 409 });
  }

  const [rating] = await db
    .insert(ratings)
    .values({ transactionId, raterId: uid, rateeId, score, comment })
    .returning();

  return NextResponse.json({ rating }, { status: 201 });
}
