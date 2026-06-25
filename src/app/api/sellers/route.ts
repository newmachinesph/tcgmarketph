import { NextRequest, NextResponse } from "next/server";
import { and, or, eq, ilike, desc, avg, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { ratings } from "@/db/schema/ratings";

const PAGE_SIZE = 24;

export async function GET(request: NextRequest) {
  const q    = request.nextUrl.searchParams.get("q")?.trim()    ?? "";
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? "";
  const game = request.nextUrl.searchParams.get("game")?.trim() ?? "";
  const sort = request.nextUrl.searchParams.get("sort") ?? "deals";
  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // Subquery: avg rating + count per ratee
  const ratingSq = db
    .select({
      rateeId:     ratings.rateeId,
      avgScore:    avg(ratings.score).as("avg_score"),
      ratingCount: count(ratings.id).as("rating_count"),
    })
    .from(ratings)
    .groupBy(ratings.rateeId)
    .as("rs");

  const where = and(
    eq(userTable.sellerEnabled, true),
    eq(userTable.isBanned, false),
    q    ? or(ilike(userTable.displayName, `%${q}%`), ilike(userTable.name, `%${q}%`)) : undefined,
    city ? ilike(userTable.city, `%${city}%`) : undefined,
    game ? ilike(userTable.games, `%${game}%`) : undefined,
  );

  const rows = await db
    .select({
      id:               userTable.id,
      name:             userTable.name,
      displayName:      userTable.displayName,
      image:            userTable.image,
      city:             userTable.city,
      bio:              userTable.bio,
      games:            userTable.games,
      kycStatus:        userTable.kycStatus,
      subscriptionTier: userTable.subscriptionTier,
      reputationScore:  userTable.reputationScore,
      createdAt:        userTable.createdAt,
      avgScore:         ratingSq.avgScore,
      ratingCount:      ratingSq.ratingCount,
    })
    .from(userTable)
    .leftJoin(ratingSq, eq(ratingSq.rateeId, userTable.id))
    .where(where)
    .orderBy(
      sort === "rating"
        ? desc(ratingSq.avgScore)
        : desc(userTable.reputationScore)
    )
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const hasMore = rows.length > PAGE_SIZE;

  return NextResponse.json({
    sellers: rows.slice(0, PAGE_SIZE).map((r) => ({
      ...r,
      avgScore:    r.avgScore    ? parseFloat(r.avgScore).toFixed(1)  : null,
      ratingCount: r.ratingCount ?? 0,
    })),
    hasMore,
    page,
  });
}
