import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, gte, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings, listingViews } from "@/db/schema/listings";
import { offers } from "@/db/schema/offers";

type Params = { params: Promise<{ id: string }> };

// GET /api/analytics/listings/[id] — daily views (30d) + offer funnel for one listing
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const uid = session.user.id;

  // Verify ownership
  const [listing] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.sellerId, uid)));
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Daily views grouped by date (last 30 days)
  const dailyRows = await db
    .select({
      date:  sql<string>`date_trunc('day', ${listingViews.viewedAt})::date`.mapWith(String),
      views: sql<number>`count(distinct coalesce(${listingViews.viewerId}, ${listingViews.ipHash}))`.mapWith(Number),
    })
    .from(listingViews)
    .where(and(
      eq(listingViews.listingId, id),
      gte(listingViews.viewedAt, thirtyDaysAgo),
    ))
    .groupBy(sql`date_trunc('day', ${listingViews.viewedAt})::date`)
    .orderBy(sql`date_trunc('day', ${listingViews.viewedAt})::date`);

  // Offer funnel
  const offerFunnel = await db
    .select({
      status: offers.status,
      total:  count(offers.id),
    })
    .from(offers)
    .where(eq(offers.listingId, id))
    .groupBy(offers.status);

  const funnel = {
    total:     0,
    pending:   0,
    accepted:  0,
    declined:  0,
    countered: 0,
    cancelled: 0,
    expired:   0,
  };
  for (const row of offerFunnel) {
    const n = Number(row.total);
    funnel.total += n;
    if (row.status in funnel) {
      (funnel as Record<string, number>)[row.status] = n;
    }
  }

  return NextResponse.json({ dailyViews: dailyRows, offerFunnel: funnel });
}
