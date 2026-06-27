import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscription } from "@/db/schema/auth";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  await db
    .insert(pushSubscription)
    .values({
      userId:   session.user.id,
      endpoint: body.endpoint,
      p256dh:   body.keys.p256dh,
      auth:     body.keys.auth,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { endpoint: string };
  if (!body?.endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  await db
    .delete(pushSubscription)
    .where(eq(pushSubscription.endpoint, body.endpoint));

  return NextResponse.json({ ok: true });
}
