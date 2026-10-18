import { NextResponse } from "next/server";
import { eq, and, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { listings } from "@/db/schema/listings";
import { user as userTable } from "@/db/schema/auth";

// GET /api/marketplace/cities — distinct seller cities with active listings
export async function GET() {
  const rows = await db
    .selectDistinct({ city: userTable.city })
    .from(userTable)
    .innerJoin(listings, and(eq(listings.sellerId, userTable.id), eq(listings.status, "active")))
    .where(and(isNotNull(userTable.city), eq(userTable.isBanned, false)))
    .orderBy(userTable.city);

  const cities = rows.map((r) => r.city).filter(Boolean) as string[];
  return NextResponse.json({ cities }, { headers: { "Cache-Control": "public, s-maxage=300" } });
}
