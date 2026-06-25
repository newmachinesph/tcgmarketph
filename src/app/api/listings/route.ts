import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, count, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, listingPhotos } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { createListingSchema } from "@/lib/validations/listing";
import { getTierLimits } from "@/lib/constants/tiers";

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

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + LISTING_TTL_DAYS);

  const [listing] = await db
    .insert(listings)
    .values({
      sellerId:           session.user.id,
      cardId:             d.cardId,
      condition:          d.condition,
      isGraded:           d.isGraded,
      gradingCompany:     d.gradingCompany,
      gradeValue:         d.gradeValue != null ? String(d.gradeValue) : null,
      isFoil:             d.isFoil,
      isFirstEdition:     d.isFirstEdition,
      type:               "fixed_price",
      price:              String(d.price),
      quantity:           d.quantity,
      description:        d.description,
      sourceCollectionId: d.sourceCollectionId,
      expiresAt,
    })
    .returning();

  // Insert photos
  if (d.photoUrls.length > 0) {
    await db.insert(listingPhotos).values(
      d.photoUrls.map((url, order) => ({ listingId: listing.id, url, order }))
    );
  }

  return NextResponse.json({ listing }, { status: 201 });
}
