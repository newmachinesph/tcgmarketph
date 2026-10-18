import { NextResponse } from "next/server";
import { eq, and, count, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings } from "@/db/schema/listings";
import { transactions } from "@/db/schema/transactions";
import { user } from "@/db/schema/auth";

// GET /api/stats — platform-wide public stats for the home page
// Cached at the edge for 60 seconds
export const revalidate = 60;

export async function GET() {
  const [
    [activeListings],
    [activeAuctions],
    [completedDeals],
    [sellerCount],
  ] = await Promise.all([
    db
      .select({ cnt: count() })
      .from(listings)
      .where(eq(listings.status, "active")),
    db
      .select({ cnt: count() })
      .from(listings)
      .where(and(eq(listings.status, "active"), eq(listings.type, "auction"))),
    db
      .select({ cnt: count() })
      .from(transactions)
      .where(eq(transactions.status, "completed")),
    db
      .select({ cnt: count() })
      .from(user)
      .where(and(eq(user.sellerEnabled, true), gt(user.reputationScore, 0))),
  ]);

  return NextResponse.json({
    activeListings: Number(activeListings?.cnt ?? 0),
    activeAuctions: Number(activeAuctions?.cnt ?? 0),
    completedDeals: Number(completedDeals?.cnt ?? 0),
    sellerCount:    Number(sellerCount?.cnt ?? 0),
  });
}
