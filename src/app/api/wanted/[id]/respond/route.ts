import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, or, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wantedListings } from "@/db/schema/wanted";
import { conversations, messages } from "@/db/schema/messages";
import { blockedUsers } from "@/db/schema/blocks";
import { createNotification } from "@/lib/notify";
import { GAME_LABEL } from "@/lib/constants/games";

type Params = { params: Promise<{ id: string }> };

const respondSchema = z.object({
  message:   z.string().min(5).max(1000).trim(),
  listingId: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body   = await request.json().catch(() => null);
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const sellerId = session.user.id;

  const [wanted] = await db
    .select()
    .from(wantedListings)
    .where(eq(wantedListings.id, id));

  if (!wanted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (wanted.status !== "open") return NextResponse.json({ error: "This request is no longer open" }, { status: 409 });
  if (wanted.userId === sellerId) return NextResponse.json({ error: "Cannot respond to your own request" }, { status: 400 });

  // Block check
  const blockRows = await db
    .select({ id: blockedUsers.id })
    .from(blockedUsers)
    .where(or(
      and(eq(blockedUsers.blockerId, sellerId),      eq(blockedUsers.blockedId, wanted.userId)),
      and(eq(blockedUsers.blockerId, wanted.userId), eq(blockedUsers.blockedId, sellerId)),
    ))
    .limit(1);
  if (blockRows.length) return NextResponse.json({ error: "Cannot contact this user" }, { status: 403 });

  // Find or create conversation (no specific listingId — it's about the wanted request)
  const [pA, pB] = sellerId < wanted.userId ? [sellerId, wanted.userId] : [wanted.userId, sellerId];

  let [conv] = await db
    .select()
    .from(conversations)
    .where(and(
      eq(conversations.participantA, pA),
      eq(conversations.participantB, pB),
      sql`${conversations.listingId} IS NULL`,
    ))
    .limit(1);

  if (!conv) {
    [conv] = await db
      .insert(conversations)
      .values({ participantA: pA, participantB: pB, listingId: null, lastMessageAt: new Date() })
      .returning();
  }

  const gameName = GAME_LABEL[wanted.game] ?? wanted.game;
  const context  = `[Re: Wanted — ${gameName} · ${wanted.cardName}]\n\n`;
  const fullBody = context + parsed.data.message + (parsed.data.listingId ? `\n\nListing: /listings/${parsed.data.listingId}` : "");

  await db.insert(messages).values({
    conversationId: conv.id,
    senderId:       sellerId,
    body:           fullBody,
  });
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id));

  const sellerName = (session.user as { displayName?: string | null }).displayName ?? session.user.name;
  createNotification(
    wanted.userId,
    "message_received",
    `${sellerName} responded to your wanted post`,
    `Re: ${wanted.cardName}`,
    `/messages/${conv.id}`,
  ).catch(console.error);

  return NextResponse.json({ conversationId: conv.id });
}
