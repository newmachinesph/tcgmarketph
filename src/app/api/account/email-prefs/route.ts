import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { getUserEmailPrefs, DEFAULT_PREFS } from "@/lib/email-prefs";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await getUserEmailPrefs(session.user.id);
  return NextResponse.json({ prefs });
}

const patchSchema = z.object({
  category: z.enum(["offers", "messages", "wishlist", "transactions"]),
  enabled:  z.boolean(),
});

export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { category, enabled } = parsed.data;
  const current = await getUserEmailPrefs(session.user.id);
  const updated = { ...DEFAULT_PREFS, ...current, [category]: enabled };

  await db
    .update(userTable)
    .set({ emailPrefs: updated })
    .where(eq(userTable.id, session.user.id));

  return NextResponse.json({ prefs: updated });
}
