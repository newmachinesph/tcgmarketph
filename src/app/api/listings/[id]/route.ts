import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { createHash } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, listingPhotos, listingViews } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user } from "@/db/schema/auth";
import { editListingSchema } from "@/lib/validations/listing";

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

  const photos = await db
    .select()
    .from(listingPhotos)
    .where(eq(listingPhotos.listingId, id))
    .orderBy(listingPhotos.order);

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
        id:             row.seller.id,
        name:           row.seller.name,
        displayName:    row.seller.displayName,
        image:          row.seller.image,
        city:           row.seller.city,
        reputationScore: row.seller.reputationScore,
        phoneVerified:  row.seller.phoneVerified,
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
