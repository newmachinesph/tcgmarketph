import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, isNull, desc } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { priceAlerts } from "@/db/schema/searches";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";

const createSchema = z.object({
  listingId:   z.string().min(1),
  targetPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alerts = await db
    .select({
      alert: priceAlerts,
      card:  { name: cardCatalog.name, imageUrl: cardCatalog.imageUrl },
      listing: { id: listings.id, price: listings.price, status: listings.status },
    })
    .from(priceAlerts)
    .innerJoin(listings,    eq(priceAlerts.listingId, listings.id))
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .where(
      and(
        eq(priceAlerts.userId, session.user.id),
        isNull(priceAlerts.triggeredAt),
      )
    )
    .orderBy(desc(priceAlerts.createdAt));

  return NextResponse.json({ alerts });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { listingId, targetPrice } = parsed.data;

  // Confirm listing exists + user is not the seller
  const [listing] = await db
    .select({ sellerId: listings.sellerId })
    .from(listings)
    .where(eq(listings.id, listingId));

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.sellerId === session.user.id) {
    return NextResponse.json({ error: "Cannot set alert on own listing" }, { status: 403 });
  }

  const [alert] = await db
    .insert(priceAlerts)
    .values({ userId: session.user.id, listingId, targetPrice })
    .onConflictDoUpdate({
      target: [priceAlerts.userId, priceAlerts.listingId],
      set:    { targetPrice, triggeredAt: null },
    })
    .returning();

  return NextResponse.json({ alert }, { status: 201 });
}
