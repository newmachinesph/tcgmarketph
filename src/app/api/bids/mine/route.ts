import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, desc, max } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, bids } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";

// GET /api/bids/mine — auctions this user has bid on + their highest bid
export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get the user's highest bid per listing
  const rows = await db
    .select({
      listingId:  bids.listingId,
      topBid:     max(bids.amount),
      listing:    listings,
      card: {
        name:     cardCatalog.name,
        setName:  cardCatalog.setName,
        game:     cardCatalog.game,
        imageUrl: cardCatalog.imageUrl,
      },
    })
    .from(bids)
    .innerJoin(listings, eq(bids.listingId, listings.id))
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .where(eq(bids.bidderId, session.user.id))
    .groupBy(bids.listingId, listings.id, cardCatalog.name, cardCatalog.setName, cardCatalog.game, cardCatalog.imageUrl)
    .orderBy(desc(listings.auctionEnd));

  return NextResponse.json({ bids: rows });
}
