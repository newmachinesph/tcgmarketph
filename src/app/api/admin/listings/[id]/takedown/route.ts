import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings } from "@/db/schema/listings";
import { adminActions } from "@/db/schema/reports";

const schema = z.object({
  reason: z.string().min(1).max(500),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { reason } = parsed.data;

  const [listing] = await db
    .update(listings)
    .set({ status: "cancelled" })
    .where(eq(listings.id, id))
    .returning({ id: listings.id, status: listings.status });

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

  await db.insert(adminActions).values({
    adminId:    session.user.id,
    actionType: "takedown_listing",
    targetType: "listing",
    targetId:   id,
    note:       reason,
  });

  return NextResponse.json({ listingId: id, status: "cancelled" });
}
