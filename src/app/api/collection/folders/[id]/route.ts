import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { collectionFolders } from "@/db/schema/cards";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name:  z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error" }, { status: 422 });

  const [folder] = await db
    .update(collectionFolders)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(collectionFolders.id, id), eq(collectionFolders.userId, session.user.id)))
    .returning();

  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ folder });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Cards in this folder will have folderId set to null (ON DELETE SET NULL)
  const [row] = await db
    .delete(collectionFolders)
    .where(and(eq(collectionFolders.id, id), eq(collectionFolders.userId, session.user.id)))
    .returning({ id: collectionFolders.id });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
