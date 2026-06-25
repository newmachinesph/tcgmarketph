import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, gte, isNull, avg, count } from "drizzle-orm";
import { createHash } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, listingPhotos, listingViews } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user } from "@/db/schema/auth";
import { ratings } from "@/db/schema/ratings";
import { priceAlerts } from "@/db/schema/searches";
import { editListingSchema } from "@/lib/validations/listing";
import { createNotification } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

// GET /api/listings/[id] — public listing detail
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const [row] = await db
    .select({ listing: listings, card: cardCatalog, seller: user })
    .from(listings)
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .innerJoin(user, eq(listings.sellerId, user.id))
    .where(eq(listings.id, id));

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [photos, sellerRatings] = await Promise.all([
    db.select().from(listingPhotos).where(eq(listingPhotos.listingId, id)).orderBy(listingPhotos.order),
    db.select({ avg: avg(ratings.score), total: count(ratings.id) })
      .from(ratings).where(eq(ratings.rateeId, row.seller.id)),
  ]);

  // Record view (fire-and-forget — never block the response)
  ;(async () => {
    try {
      const hdrs = await headers();
      const session = await auth.api.getSession({ headers: hdrs });
      const viewerId = session?.user.id ?? null;

      // Skip own views
      if (viewerId && viewerId === row.listing.sellerId) return;

      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        ?? request.headers.get("x-real-ip")
        ?? "unknown";
      const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 16);

      await db.insert(listingViews).values({ listingId: id, viewerId, ipHash });
    } catch {
      // non-fatal
    }
  })();

  return NextResponse.json({
    listing: {
      ...row.listing,
      card: row.card,
      photos,
      seller: {
        id:              row.seller.id,
        name:            row.seller.name,
        displayName:     row.seller.displayName,
        image:           row.seller.image,
        city:            row.seller.city,
        reputationScore: row.seller.reputationScore,
        phoneVerified:   row.seller.phoneVerified,
        avgRating:       sellerRatings[0]?.avg ? parseFloat(sellerRatings[0].avg).toFixed(1) : null,
        ratingCount:     sellerRatings[0]?.total ?? 0,
      },
    },
  });
}

// PATCH /api/listings/[id] — edit price, description, or status (owner only)
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = editListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.price     != null) patch.price       = String(parsed.data.price);
  if (parsed.data.quantity  != null) patch.quantity     = parsed.data.quantity;
  if (parsed.data.description != null) patch.description = parsed.data.description;
  if (parsed.data.status    != null) patch.status       = parsed.data.status;

  const [updated] = await db
    .update(listings)
    .set(patch)
    .where(and(eq(listings.id, id), eq(listings.sellerId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If price was updated, check for triggered price-drop alerts (fire-and-forget)
  if (parsed.data.price != null) {
    void (async () => {
      try {
        const newPriceNum = parseFloat(updated.price);
        // Trigger alerts where user's targetPrice >= new listing price (price fell to/below target)
        const triggered = await db
          .select({ alertId: priceAlerts.id, userId: priceAlerts.userId })
          .from(priceAlerts)
          .where(
            and(
              eq(priceAlerts.listingId, id),
              isNull(priceAlerts.triggeredAt),
              gte(priceAlerts.targetPrice, updated.price),
            )
          );
        if (triggered.length === 0) return;
        const now = new Date();
        await Promise.all(
          triggered.map((a) => {
            createNotification(
              a.userId,
              "system",
              "Price drop alert",
              `A listing you're watching dropped to ₱${newPriceNum.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
              `/listings/${id}`,
            ).catch(console.error);
            return db
              .update(priceAlerts)
              .set({ triggeredAt: now })
              .where(eq(priceAlerts.id, a.alertId));
          })
        );
      } catch { /* non-fatal */ }
    })();
  }

  return NextResponse.json({ listing: updated });
}

// DELETE /api/listings/[id] — cancel listing (owner only)
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [updated] = await db
    .update(listings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(listings.id, id), eq(listings.sellerId, session.user.id)))
    .returning({ id: listings.id });

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
