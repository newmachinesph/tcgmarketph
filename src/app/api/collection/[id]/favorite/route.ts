import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userCollection } from "@/db/schema/cards";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ isFavorite: z.boolean() });

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error" }, { status: 422 });

  const [row] = await db
    .update(userCollection)
    .set({ isFavorite: parsed.data.isFavorite, updatedAt: new Date() })
    .where(and(eq(userCollection.id, id), eq(userCollection.userId, session.user.id)))
    .returning({ id: userCollection.id, isFavorite: userCollection.isFavorite });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, isFavorite: row.isFavorite });
}
