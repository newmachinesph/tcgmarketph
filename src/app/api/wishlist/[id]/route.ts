import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userWishlist } from "@/db/schema/cards";
import { wishlistEntrySchema } from "@/lib/validations/wishlist";

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/wishlist/[id] ──────────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
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

  const [row] = await db
    .update(userWishlist)
    .set({
      priority:    d.priority,
      maxBuyPrice: d.maxBuyPrice != null ? String(d.maxBuyPrice) : null,
      notes:       d.notes ?? null,
      updatedAt:   new Date(),
    })
    .where(and(eq(userWishlist.id, id), eq(userWishlist.userId, session.user.id)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ entry: row });
}

// ── DELETE /api/wishlist/[id] ─────────────────────────────────────────────────

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db
    .delete(userWishlist)
    .where(and(eq(userWishlist.id, id), eq(userWishlist.userId, session.user.id)))
    .returning({ id: userWishlist.id });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
