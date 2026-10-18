import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userCollection, cardCatalog } from "@/db/schema/cards";
import { collectionEntrySchema } from "@/lib/validations/collection";

// ── GET /api/collection ───────────────────────────────────────────────────────
// Returns all collection entries for the logged-in user, joined with card data.

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await db
    .select({ entry: userCollection, card: cardCatalog })
    .from(userCollection)
    .innerJoin(cardCatalog, eq(userCollection.cardId, cardCatalog.id))
    .where(eq(userCollection.userId, session.user.id))
    .orderBy(desc(userCollection.createdAt));

  return NextResponse.json({ entries });
}

// ── POST /api/collection ──────────────────────────────────────────────────────
// Add a new entry to the logged-in user's collection.

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = collectionEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const d = parsed.data;

  try {
    const [row] = await db
      .insert(userCollection)
      .values({
        userId:         session.user.id,
        cardId:         d.cardId,
        quantity:       d.quantity,
        condition:      d.condition,
        gradingCompany: d.isGraded ? d.gradingCompany as "psa" | "bgs" | "cgc" : "none",
        gradeValue:     d.isGraded && d.gradeValue != null ? String(d.gradeValue) : null,
        isFoil:         d.isFoil,
        isFirstEdition: d.isFirstEdition,
        language:       d.language,
        purchasePrice:  d.purchasePrice != null ? String(d.purchasePrice) : null,
        notes:          d.notes ?? null,
        isFavorite:     d.isFavorite,
      })
      .returning();

    return NextResponse.json({ entry: row }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err) {
      const code = (err as { code: string }).code;
      // FK violation — cardId doesn't exist in card_catalog
      if (code === "23503") {
        return NextResponse.json({ error: "Card not found in catalog" }, { status: 422 });
      }
    }
    throw err;
  }
}
