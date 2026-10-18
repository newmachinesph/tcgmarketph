import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userCollection } from "@/db/schema/cards";
import { collectionEntrySchema } from "@/lib/validations/collection";

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/collection/[id] ────────────────────────────────────────────────
// Update a collection entry. Only the owner can edit.

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
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

  const [row] = await db
    .update(userCollection)
    .set({
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
      updatedAt:      new Date(),
    })
    // Scope update to this user's entry only — prevents editing other users' cards
    .where(and(eq(userCollection.id, id), eq(userCollection.userId, session.user.id)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ entry: row });
}

// ── DELETE /api/collection/[id] ───────────────────────────────────────────────

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db
    .delete(userCollection)
    .where(and(eq(userCollection.id, id), eq(userCollection.userId, session.user.id)))
    .returning({ id: userCollection.id });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// ── PATCH /api/collection/[id]/favorite toggle ────────────────────────────────
// Handled inline in PATCH above (set isFavorite directly in the entry form)
