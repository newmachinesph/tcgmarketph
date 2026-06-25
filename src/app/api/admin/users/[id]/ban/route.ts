import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { adminActions } from "@/db/schema/reports";

const schema = z.object({
  ban:    z.boolean(),
  reason: z.string().max(500).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot ban yourself" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { ban, reason } = parsed.data;

  const [updated] = await db
    .update(userTable)
    .set({
      isBanned:     ban,
      bannedReason: ban ? (reason ?? "Banned by admin") : null,
    })
    .where(eq(userTable.id, id))
    .returning({ id: userTable.id, isBanned: userTable.isBanned });

  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await db.insert(adminActions).values({
    adminId:    session.user.id,
    actionType: ban ? "ban_user" : "unban_user",
    targetType: "user",
    targetId:   id,
    note:       reason ?? null,
  });

  return NextResponse.json({ userId: id, isBanned: ban });
}
