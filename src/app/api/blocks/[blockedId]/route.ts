import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { blockedUsers } from "@/db/schema/blocks";

type Params = { params: Promise<{ blockedId: string }> };

// DELETE /api/blocks/[blockedId] — unblock a user
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { blockedId } = await params;
  const uid = session.user.id;

  await db
    .delete(blockedUsers)
    .where(and(eq(blockedUsers.blockerId, uid), eq(blockedUsers.blockedId, blockedId)));

  return NextResponse.json({ blocked: false });
}
