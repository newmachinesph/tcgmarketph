import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, count, inArray } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, listingPhotos } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { createListingSchema } from "@/lib/validations/listing";
import { getTierLimits } from "@/lib/constants/tiers";
import { inngest } from "@/lib/inngest/client";
import { listingRatelimit } from "@/lib/rate-limit";
import { toListingSlug } from "@/lib/utils/slug";

const LISTING_TTL_DAYS = 30;

// GET /api/listings — my listings (authenticated)
export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select({ listing: listings, card: cardCatalog })
    .from(listings)
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .where(eq(listings.sellerId, session.user.id))
    .orderBy(listings.createdAt);

  const ids = rows.map((r) => r.listing.id);

  const allPhotos = ids.length
    ? await db
        .select()
        .from(listingPhotos)
        .where(inArray(listingPhotos.listingId, ids))
        .orderBy(listingPhotos.order)
    : [];

  const photosByListing = allPhotos.reduce<Record<string, typeof allPhotos>>((acc, p) => {
    (acc[p.listingId] ??= []).push(p);
    return acc;
  }, {});

  return NextResponse.json({
    listings: rows.map((r) => ({
      ...r.listing,
      card: r.card,
      photos: photosByListing[r.listing.id] ?? [],
    })),
  });
}

// POST /api/listings — create a listing
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (listingRatelimit) {
    const { success } = await listingRatelimit.limit(session.user.id);
    if (!success) return NextResponse.json({ error: "Too many listings created — please wait a few minutes" }, { status: 429 });
  }

  // Gate: phone verified
  if (!session.user.phoneVerified) {
    return NextResponse.json(
      { error: "Phone verification required to create listings" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  const tier = session.user.subscriptionTier ?? "free";
  const limits = getTierLimits(tier);

  // Enforce tier active listing cap
  const [{ total }] = await db
    .select({ total: count() })
    .from(listings)
    .where(and(eq(listings.sellerId, session.user.id), eq(listings.status, "active")));

  if (total >= limits.maxActiveListings) {
    return NextResponse.json(
      { error: `Active listing limit reached (${limits.maxActiveListings} for ${tier} tier)` },
      { status: 403 }
    );
  }

  // Enforce photo cap per tier
  if (d.photoUrls.length > limits.maxPhotosPerListing) {
    return NextResponse.json(
      { error: `Max ${limits.maxPhotosPerListing} photos allowed on ${tier} tier` },
      { status: 400 }
    );
  }

  // TODO: KYC hook — for listings above ₱5,000, require KYC in a future phase
  if (parseFloat(String(d.price)) > 5000) {
    // Future: check session.user.kycStatus === "verified"
  }

  const isAuction = d.type === "auction";
  const auctionEnd = isAuction && d.auctionEnd ? new Date(d.auctionEnd) : null;

  const expiresAt = isAuction && auctionEnd
    ? auctionEnd
    : (() => { const d = new Date(); d.setDate(d.getDate() + LISTING_TTL_DAYS); return d; })();

  // Pre-generate ID so we can build the slug before insert
  const listingId = createId();
  const [cardRow] = await db.select({ name: cardCatalog.name }).from(cardCatalog).where(eq(cardCatalog.id, d.cardId)).limit(1);
  const slug = cardRow ? toListingSlug(cardRow.name, listingId) : undefined;

  const [listing] = await db
    .insert(listings)
    .values({
      id:                 listingId,
      slug,
      sellerId:           session.user.id,
      cardId:             d.cardId,
      condition:          d.condition,
      isGraded:           d.isGraded,
      gradingCompany:     d.gradingCompany,
      gradeValue:         d.gradeValue != null ? String(d.gradeValue) : null,
      isFoil:             d.isFoil,
      isFirstEdition:     d.isFirstEdition,
      type:               d.type,
      price:              isAuction ? (d.startingPrice ? String(d.startingPrice) : "0") : String(d.price),
      quantity:           isAuction ? 1 : d.quantity,
      description:        d.description,
      sourceCollectionId: d.sourceCollectionId,
      // Auction fields
      startingPrice:  isAuction && d.startingPrice ? String(d.startingPrice) : null,
      bidIncrement:   isAuction ? String(d.bidIncrement ?? 50) : null,
      reservePrice:   isAuction && d.reservePrice ? String(d.reservePrice) : null,
      auctionStart:   isAuction ? new Date() : null,
      auctionEnd:     auctionEnd,
      expiresAt,
    })
    .returning();

  // Insert photos
  if (d.photoUrls.length > 0) {
    await db.insert(listingPhotos).values(
      d.photoUrls.map((url, order) => ({ listingId: listing.id, url, order }))
    );
  }

  // Trigger wishlist + saved-search match alerts asynchronously
  inngest.send([
    {
      name: "listings/wishlist.match",
      data: { listingId: listing.id, cardId: listing.cardId, sellerId: listing.sellerId, price: listing.price },
    },
    {
      name: "listings/saved-search.match",
      data: { listingId: listing.id },
    },
  ]).catch(console.error);

  return NextResponse.json({ listing }, { status: 201 });
}
