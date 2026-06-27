import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema/auth";

const schema = z.object({ enabled: z.boolean() });

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const u = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
  if (!u?.phoneVerified) {
    return NextResponse.json({ error: "Phone not verified" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await db
    .update(user)
    .set({ smsNotifications: parsed.data.enabled, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ ok: true, enabled: parsed.data.enabled });
}
