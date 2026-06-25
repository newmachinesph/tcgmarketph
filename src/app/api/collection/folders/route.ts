import { NextRequest, NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { collectionFolders } from "@/db/schema/cards";
import { z } from "zod";

const createSchema = z.object({
  name:  z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folders = await db
    .select()
    .from(collectionFolders)
    .where(eq(collectionFolders.userId, session.user.id))
    .orderBy(asc(collectionFolders.position), asc(collectionFolders.createdAt));

  return NextResponse.json({ folders });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation error" }, { status: 422 });

  const [folder] = await db
    .insert(collectionFolders)
    .values({
      userId: session.user.id,
      name:   parsed.data.name,
      color:  parsed.data.color,
    })
    .returning();

  return NextResponse.json({ folder }, { status: 201 });
}
