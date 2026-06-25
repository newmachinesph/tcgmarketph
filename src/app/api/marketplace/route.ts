import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, gte, lte, desc, asc, sql, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, listingPhotos } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user as userTable } from "@/db/schema/auth";

const PAGE_SIZE = 24;

// GET /api/marketplace — browse active listings with search, filter, sort, pagination
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp       = request.nextUrl.searchParams;
  const q        = sp.get("q")?.trim() ?? "";
  const game     = sp.get("game") ?? "";
  const condition = sp.get("condition") ?? "";
  const isGraded = sp.get("isGraded");
  const minPrice = sp.get("minPrice") ?? "";
  const maxPrice = sp.get("maxPrice") ?? "";
  const sort     = sp.get("sort") ?? "newest";
  const page     = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const offset   = (page - 1) * PAGE_SIZE;

  // ── Build WHERE conditions ──────────────────────────────────────────────
  const conditions = [
    eq(listings.status, "active"),
    eq(userTable.isBanned, false),
  ];

  if (game === "pokemon" || game === "one_piece") {
    conditions.push(eq(cardCatalog.game, game));
  }
  if (
    condition === "near_mint" ||
    condition === "lightly_played" ||
    condition === "moderately_played" ||
    condition === "heavily_played" ||
    condition === "damaged"
  ) {
    conditions.push(eq(listings.condition, condition));
  }
  if (isGraded === "true")  conditions.push(eq(listings.isGraded, true));
  if (isGraded === "false") conditions.push(eq(listings.isGraded, false));

  const minNum = parseFloat(minPrice);
  const maxNum = parseFloat(maxPrice);
  if (!isNaN(minNum) && minNum > 0) conditions.push(gte(listings.price, String(minNum)));
  if (!isNaN(maxNum) && maxNum > 0) conditions.push(lte(listings.price, String(maxNum)));

  if (q.length >= 2) {
    conditions.push(sql`similarity(${cardCatalog.name}, ${q}) > 0.1`);
  }

  // ── ORDER BY ────────────────────────────────────────────────────────────
  const orderBy =
    sort === "price_asc"
      ? asc(sql`CAST(${listings.price} AS numeric)`)
      : sort === "price_desc"
      ? desc(sql`CAST(${listings.price} AS numeric)`)
      : q.length >= 2
      ? desc(sql`similarity(${cardCatalog.name}, ${q})`)
      : desc(listings.createdAt);

  // ── Main query ──────────────────────────────────────────────────────────
  const rows = await db
    .select({
      listing: listings,
      card: {
        id:          cardCatalog.id,
        name:        cardCatalog.name,
        setName:     cardCatalog.setName,
        game:        cardCatalog.game,
        imageUrl:    cardCatalog.imageUrl,
        marketPrice: cardCatalog.marketPrice,
      },
      seller: {
        id:              userTable.id,
        name:            userTable.name,
        displayName:     userTable.displayName,
        image:           userTable.image,
        city:            userTable.city,
        phoneVerified:   userTable.phoneVerified,
        reputationScore: userTable.reputationScore,
      },
    })
    .from(listings)
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .innerJoin(userTable, eq(listings.sellerId, userTable.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(PAGE_SIZE)
    .offset(offset);

  // ── Cover photo (order=0) per listing ───────────────────────────────────
  const ids = rows.map((r) => r.listing.id);
  const photos = ids.length
    ? await db
        .select()
        .from(listingPhotos)
        .where(and(inArray(listingPhotos.listingId, ids), eq(listingPhotos.order, 0)))
    : [];

  const coverByListing = Object.fromEntries(photos.map((p) => [p.listingId, p.url]));

  return NextResponse.json({
    listings: rows.map((r) => ({
      ...r.listing,
      card:       r.card,
      seller:     r.seller,
      coverPhoto: coverByListing[r.listing.id] ?? null,
    })),
    page,
    pageSize: PAGE_SIZE,
    hasMore:  rows.length === PAGE_SIZE,
  });
}
