import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { blockedUsers } from "@/db/schema/blocks";
import { user as userTable } from "@/db/schema/auth";

const schema = z.object({ blockedId: z.string().min(1) });

// GET /api/blocks — list users the current user has blocked
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;

  const rows = await db
    .select()
    .from(blockedUsers)
    .where(eq(blockedUsers.blockerId, uid));

  const ids = rows.map((r) => r.blockedId);
  const users = ids.length
    ? await db
        .select({ id: userTable.id, name: userTable.name, displayName: userTable.displayName, image: userTable.image })
        .from(userTable)
        .where(inArray(userTable.id, ids))
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const blocks = rows.map((r) => ({ ...r, user: userMap[r.blockedId] ?? null }));
  return NextResponse.json({ blocks });
}

// POST /api/blocks — block a user
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid  = session.user.id;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { blockedId } = parsed.data;
  if (blockedId === uid) return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

  const [row] = await db
    .insert(blockedUsers)
    .values({ blockerId: uid, blockedId })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({ blocked: true, id: row?.id }, { status: 201 });
}
