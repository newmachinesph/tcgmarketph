import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, desc, avg, count, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { listings, listingPhotos } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { ratings } from "@/db/schema/ratings";
import { transactions } from "@/db/schema/transactions";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  const PROFILE_FIELDS = {
    id:                   userTable.id,
    name:                 userTable.name,
    displayName:          userTable.displayName,
    username:             userTable.username,
    collectionPublic:     userTable.collectionPublic,
    image:                userTable.image,
    city:                 userTable.city,
    bio:                  userTable.bio,
    phoneVerified:        userTable.phoneVerified,
    reputationScore:      userTable.reputationScore,
    noShowCount:          userTable.noShowCount,
    isBanned:             userTable.isBanned,
    createdAt:            userTable.createdAt,
    subscriptionTier:     userTable.subscriptionTier,
    subscriptionExpiresAt: userTable.subscriptionExpiresAt,
  };

  // Try by ID first, then by username slug
  let [profile] = await db.select(PROFILE_FIELDS).from(userTable).where(eq(userTable.id, id));
  if (!profile) {
    [profile] = await db.select(PROFILE_FIELDS).from(userTable).where(eq(userTable.username, id));
  }

  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch active listings, ratings stats, completed deal count in parallel
  const [listingRows, ratingStats, completedDeals, ratingRows] = await Promise.all([
    // Active listings (paginated)
    db
      .select({ listing: listings, card: cardCatalog })
      .from(listings)
      .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
      .where(and(eq(listings.sellerId, id), eq(listings.status, "active")))
      .orderBy(desc(listings.createdAt))
      .limit(limit + 1)
      .offset(offset),

    // Avg rating + count
    db
      .select({ avg: avg(ratings.score), total: count(ratings.id) })
      .from(ratings)
      .where(eq(ratings.rateeId, id)),

    // Completed deal count (as buyer or seller)
    db
      .select({ n: count(transactions.id) })
      .from(transactions)
      .where(
        and(
          or(eq(transactions.buyerId, id), eq(transactions.sellerId, id)),
          eq(transactions.status, "completed")
        )
      ),

    // Recent ratings received (newest first)
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
      .where(eq(ratings.rateeId, id))
      .orderBy(desc(ratings.createdAt))
      .limit(20),
  ]);

  const hasMore = listingRows.length > limit;
  const pageListings = listingRows.slice(0, limit);

  // Attach cover photos
  const listingIds = pageListings.map((r) => r.listing.id);
  const photos = listingIds.length
    ? await db
        .select()
        .from(listingPhotos)
        .where(inArray(listingPhotos.listingId, listingIds))
        .orderBy(listingPhotos.order)
    : [];
  const photoMap: Record<string, string> = {};
  for (const p of photos) {
    if (!photoMap[p.listingId]) photoMap[p.listingId] = p.url;
  }

  return NextResponse.json({
    seller: {
      ...profile,
      avgScore:       ratingStats[0]?.avg ? parseFloat(ratingStats[0].avg).toFixed(1) : null,
      ratingCount:    ratingStats[0]?.total ?? 0,
      completedDeals: completedDeals[0]?.n ?? 0,
    },
    listings: pageListings.map((r) => ({
      ...r.listing,
      card:       r.card,
      coverPhoto: photoMap[r.listing.id] ?? null,
    })),
    ratings: ratingRows,
    hasMore,
    page,
  });
}
