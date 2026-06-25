import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userWishlist, cardCatalog } from "@/db/schema/cards";
import { wishlistEntrySchema } from "@/lib/validations/wishlist";

// ── GET /api/wishlist ─────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await db
    .select({ entry: userWishlist, card: cardCatalog })
    .from(userWishlist)
    .innerJoin(cardCatalog, eq(userWishlist.cardId, cardCatalog.id))
    .where(eq(userWishlist.userId, session.user.id))
    .orderBy(desc(userWishlist.createdAt));

  return NextResponse.json({ entries });
}

// ── POST /api/wishlist ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = wishlistEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const d = parsed.data;

  try {
    const [row] = await db
      .insert(userWishlist)
      .values({
        userId:      session.user.id,
        cardId:      d.cardId,
        priority:    d.priority,
        maxBuyPrice: d.maxBuyPrice != null ? String(d.maxBuyPrice) : null,
        notes:       d.notes ?? null,
      })
      .returning();

    return NextResponse.json({ entry: row }, { status: 201 });
  } catch (err: unknown) {
    // Unique violation: already on wishlist
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "23505") {
      return NextResponse.json({ error: "Card already on wishlist" }, { status: 409 });
    }
    throw err;
  }
}
