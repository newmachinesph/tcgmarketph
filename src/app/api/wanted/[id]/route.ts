import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wantedListings } from "@/db/schema/wanted";
import { user as userTable } from "@/db/schema/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const [row] = await db
    .select({
      wanted:      wantedListings,
      userName:    userTable.name,
      displayName: userTable.displayName,
      userImage:   userTable.image,
      city:        userTable.city,
      userId:      userTable.id,
    })
    .from(wantedListings)
    .innerJoin(userTable, eq(wantedListings.userId, userTable.id))
    .where(eq(wantedListings.id, id));

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...row.wanted,
    poster: { id: row.userId, name: row.displayName ?? row.userName, image: row.userImage, city: row.city },
  });
}

const patchSchema = z.object({
  status: z.enum(["filled", "cancelled"]),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const [item] = await db
    .select()
    .from(wantedListings)
    .where(and(eq(wantedListings.id, id), eq(wantedListings.userId, session.user.id)));

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.status !== "open") return NextResponse.json({ error: "Already closed" }, { status: 409 });

  await db
    .update(wantedListings)
    .set({ status: parsed.data.status })
    .where(eq(wantedListings.id, id));

  return NextResponse.json({ ok: true });
}
