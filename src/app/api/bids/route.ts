import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, bids } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user as userTable } from "@/db/schema/auth";
import { bidRatelimit } from "@/lib/rate-limit";
import { publishBid } from "@/lib/ably";
import { createNotification } from "@/lib/notify";

const ANTI_SNIPE_SECONDS = 30;

const placeBidSchema = z.object({
  listingId: z.string().min(1),
  amount:    z.coerce.number().positive("Bid must be greater than 0"),
});

// GET /api/bids?listingId=xxx — recent bids for an auction
export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get("listingId");
  if (!listingId) return NextResponse.json({ error: "listingId required" }, { status: 400 });

  const rows = await db
    .select({
      bid: bids,
      bidder: {
        name:        userTable.name,
        displayName: userTable.displayName,
        image:       userTable.image,
      },
    })
    .from(bids)
    .innerJoin(userTable, eq(bids.bidderId, userTable.id))
    .where(eq(bids.listingId, listingId))
    .orderBy(desc(bids.createdAt))
    .limit(20);

  return NextResponse.json({
    bids: rows.map((r) => ({
      ...r.bid,
      bidderName: r.bidder.displayName ?? r.bidder.name,
      bidderImage: r.bidder.image,
    })),
  });
}

// POST /api/bids — place a bid
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Rate limit ───────────────────────────────────────────────────────────
  if (bidRatelimit) {
    const { success } = await bidRatelimit.limit(session.user.id);
    if (!success) {
      return NextResponse.json({ error: "Too many bids — slow down" }, { status: 429 });
    }
  }

  const body   = await request.json().catch(() => null);
  const parsed = placeBidSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { listingId, amount } = parsed.data;
  const uid = session.user.id;

  // ── Load listing ─────────────────────────────────────────────────────────
  const [row] = await db
    .select({ listing: listings, card: cardCatalog, seller: userTable })
    .from(listings)
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .innerJoin(userTable, eq(listings.sellerId, userTable.id))
    .where(eq(listings.id, listingId));

  if (!row) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  const listing = row.listing;

  if (listing.type !== "auction") {
    return NextResponse.json({ error: "This listing is not an auction" }, { status: 400 });
  }
  if (listing.status !== "active") {
    return NextResponse.json({ error: "Auction is not active" }, { status: 409 });
  }
  if (!listing.auctionEnd || new Date(listing.auctionEnd) <= new Date()) {
    return NextResponse.json({ error: "Auction has ended" }, { status: 409 });
  }

  // ── Anti-shill ───────────────────────────────────────────────────────────
  if (listing.sellerId === uid) {
    return NextResponse.json({ error: "Sellers cannot bid on their own auctions" }, { status: 403 });
  }

  // ── Compute minimum bid ──────────────────────────────────────────────────
  const increment  = parseFloat(listing.bidIncrement ?? "50");
  const minBid     = listing.currentBid
    ? parseFloat(listing.currentBid) + increment
    : parseFloat(listing.startingPrice ?? "0");

  if (amount < minBid) {
    return NextResponse.json({
      error: `Minimum bid is ₱${minBid.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    }, { status: 400 });
  }

  // ── Atomic UPDATE — wins the race condition ───────────────────────────────
  // We update current_bid only if it still matches our read (no one snuck in between).
  const newBidStr  = String(amount);
  const minBidStr  = String(minBid);

  // Anti-snipe: if within ANTI_SNIPE_SECONDS of end, extend by that amount
  const now         = new Date();
  const end         = new Date(listing.auctionEnd);
  const secsLeft    = (end.getTime() - now.getTime()) / 1000;
  const newEnd      = secsLeft <= ANTI_SNIPE_SECONDS
    ? new Date(end.getTime() + ANTI_SNIPE_SECONDS * 1000)
    : end;

  const updated = await db
    .update(listings)
    .set({
      currentBid: newBidStr,
      auctionEnd: newEnd,
      expiresAt:  newEnd,
      updatedAt:  now,
    })
    .where(
      and(
        eq(listings.id, listingId),
        eq(listings.status, "active"),
        // Ensure no higher bid snuck in since we read
        sql`(${listings.currentBid} IS NULL OR CAST(${listings.currentBid} AS numeric) < ${minBidStr}::numeric)`
      )
    )
    .returning({ id: listings.id });

  if (updated.length === 0) {
    return NextResponse.json({ error: "A higher bid was placed. Refresh and try again." }, { status: 409 });
  }

  // ── Find previous top bidder to notify of outbid ─────────────────────────
  const [prevTop] = await db
    .select({ bidderId: bids.bidderId })
    .from(bids)
    .where(and(eq(bids.listingId, listingId), sql`${bids.bidderId} != ${uid}`))
    .orderBy(desc(bids.amount))
    .limit(1);

  // ── Insert bid record ────────────────────────────────────────────────────
  await db.insert(bids).values({ listingId, bidderId: uid, amount: newBidStr });

  // ── Bid count ────────────────────────────────────────────────────────────
  const [{ total }] = await db
    .select({ total: count() })
    .from(bids)
    .where(eq(bids.listingId, listingId));

  // ── Notify outbid user ───────────────────────────────────────────────────
  if (prevTop && prevTop.bidderId !== uid) {
    createNotification(
      prevTop.bidderId,
      "auction_outbid",
      `You've been outbid on ${row.card.name}`,
      `New top bid: ₱${parseFloat(newBidStr).toLocaleString("en-PH")}`,
      `/listings/${listingId}`,
    ).catch(console.error);
  }

  // ── Publish via Ably ─────────────────────────────────────────────────────
  const bidderName = session.user.displayName ?? session.user.name;
  publishBid(listingId, {
    amount:     newBidStr,
    bidderName,
    currentBid: newBidStr,
    auctionEnd: newEnd.toISOString(),
    bidCount:   total,
  }).catch(console.error);

  return NextResponse.json({
    ok:         true,
    currentBid: newBidStr,
    auctionEnd: newEnd.toISOString(),
    bidCount:   total,
  }, { status: 201 });
}
