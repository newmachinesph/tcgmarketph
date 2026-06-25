import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userCollection } from "@/db/schema/cards";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const moveSchema = z.object({
  // null = move to "All Cards" (unfiled)
  folderId: z.string().nullable(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => ({}));
  const parsed = moveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error" }, { status: 422 });

  const [row] = await db
    .update(userCollection)
    .set({ folderId: parsed.data.folderId, updatedAt: new Date() })
    .where(and(eq(userCollection.id, id), eq(userCollection.userId, session.user.id)))
    .returning({ id: userCollection.id, folderId: userCollection.folderId });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, folderId: row.folderId });
}
