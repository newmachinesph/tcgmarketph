import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, gte, count, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, listingViews } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { offers } from "@/db/schema/offers";
import { transactions } from "@/db/schema/transactions";

// GET /api/analytics/listings — seller's listing performance summary
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  // All my listings (any status) with card name
  const myListings = await db
    .select({
      listing: listings,
      card:    { name: cardCatalog.name, imageUrl: cardCatalog.imageUrl },
    })
    .from(listings)
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .where(eq(listings.sellerId, uid));

  if (myListings.length === 0) {
    return NextResponse.json({
      listings: [],
      summary:  { activeListings: 0, viewsThisMonth: 0, offersReceived: 0, dealsClosed: 0 },
    });
  }

  const listingIds = myListings.map((r) => r.listing.id);

  // Views this month per listing (distinct viewer)
  const viewRows = await db
    .select({
      listingId: listingViews.listingId,
      views: sql<number>`count(distinct coalesce(${listingViews.viewerId}, ${listingViews.ipHash}))`.mapWith(Number),
    })
    .from(listingViews)
    .where(and(
      inArray(listingViews.listingId, listingIds),
      gte(listingViews.viewedAt, monthAgo),
    ))
    .groupBy(listingViews.listingId);

  // Offers per listing
  const offerRows = await db
    .select({
      listingId:  offers.listingId,
      offerCount: count(offers.id),
    })
    .from(offers)
    .where(inArray(offers.listingId, listingIds))
    .groupBy(offers.listingId);

  // Completed deals total for this seller
  const [dealRow] = await db
    .select({ total: count(transactions.id) })
    .from(transactions)
    .where(and(eq(transactions.sellerId, uid), eq(transactions.status, "completed")));

  const viewMap  = Object.fromEntries(viewRows.map((r)  => [r.listingId, r.views]));
  const offerMap = Object.fromEntries(offerRows.map((r) => [r.listingId, Number(r.offerCount)]));

  const result = myListings.map(({ listing, card }) => ({
    id:         listing.id,
    cardName:   card.name,
    imageUrl:   card.imageUrl,
    status:     listing.status,
    type:       listing.type,
    price:      listing.price,
    createdAt:  listing.createdAt,
    views:      viewMap[listing.id]  ?? 0,
    offerCount: offerMap[listing.id] ?? 0,
  }));

  const summary = {
    activeListings: myListings.filter((r) => r.listing.status === "active").length,
    viewsThisMonth: viewRows.reduce((s, r) => s + r.views, 0),
    offersReceived: offerRows.reduce((s, r) => s + Number(r.offerCount), 0),
    dealsClosed:    Number(dealRow?.total ?? 0),
  };

  return NextResponse.json({ listings: result, summary });
}
