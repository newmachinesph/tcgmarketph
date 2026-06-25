import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, or, desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user as userTable } from "@/db/schema/auth";
import { offers } from "@/db/schema/offers";
import { emailOfferReceived } from "@/lib/email";

const OFFER_TTL_HOURS = 48;

const createSchema = z.object({
  listingId:    z.string().min(1),
  offeredPrice: z.coerce.number().positive("Offer must be greater than 0"),
  message:      z.string().max(500).optional(),
});

// GET /api/offers — my offers (as buyer) + offers on my listings (as seller)
export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;

  const rows = await db
    .select({
      offer: offers,
      card: {
        name:     cardCatalog.name,
        setName:  cardCatalog.setName,
        game:     cardCatalog.game,
        imageUrl: cardCatalog.imageUrl,
      },
    })
    .from(offers)
    .innerJoin(listings, eq(offers.listingId, listings.id))
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .where(or(eq(offers.buyerId, uid), eq(offers.sellerId, uid)))
    .orderBy(desc(offers.updatedAt));

  // Fetch buyer + seller names in one query
  const userIds = [...new Set(rows.flatMap((r) => [r.offer.buyerId, r.offer.sellerId]))];
  const users = userIds.length
    ? await db
        .select({ id: userTable.id, name: userTable.name, displayName: userTable.displayName, image: userTable.image })
        .from(userTable)
        .where(or(...userIds.map((id) => eq(userTable.id, id))))
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json({
    offers: rows.map((r) => ({
      ...r.offer,
      card:   r.card,
      buyer:  userMap[r.offer.buyerId],
      seller: userMap[r.offer.sellerId],
      role:   r.offer.buyerId === uid ? "buyer" : "seller",
    })),
  });
}

// POST /api/offers — make an offer on a listing
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { listingId, offeredPrice, message } = parsed.data;

  // Fetch listing + seller
  const [row] = await db
    .select({ listing: listings, card: cardCatalog, seller: userTable })
    .from(listings)
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .innerJoin(userTable, eq(listings.sellerId, userTable.id))
    .where(eq(listings.id, listingId));

  if (!row) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (row.listing.status !== "active") {
    return NextResponse.json({ error: "This listing is no longer available" }, { status: 409 });
  }
  if (row.listing.sellerId === session.user.id) {
    return NextResponse.json({ error: "You cannot make an offer on your own listing" }, { status: 400 });
  }

  // One open offer per buyer per listing
  const [existing] = await db
    .select({ id: offers.id })
    .from(offers)
    .where(
      and(
        eq(offers.listingId, listingId),
        eq(offers.buyerId, session.user.id),
        or(eq(offers.status, "pending"), eq(offers.status, "countered"))
      )
    );
  if (existing) {
    return NextResponse.json({ error: "You already have an open offer on this listing" }, { status: 409 });
  }

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + OFFER_TTL_HOURS);

  const [offer] = await db
    .insert(offers)
    .values({
      listingId,
      buyerId:      session.user.id,
      sellerId:     row.listing.sellerId,
      offeredPrice: String(offeredPrice),
      message,
      expiresAt,
    })
    .returning();

  emailOfferReceived({
    sellerEmail:  row.seller.email,
    sellerName:   row.seller.displayName ?? row.seller.name,
    buyerName:    session.user.displayName ?? session.user.name,
    cardName:     row.card.name,
    listingPrice: row.listing.price,
    offeredPrice: String(offeredPrice),
    message,
    offerId:      offer.id,
  }).catch(console.error);

  return NextResponse.json({ offer }, { status: 201 });
}
