import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, or, and, desc, count, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { conversations, messages } from "@/db/schema/messages";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { blockedUsers } from "@/db/schema/blocks";

const createSchema = z.object({
  recipientId: z.string().min(1),
  listingId:   z.string().optional(),
  firstMessage: z.string().min(1).max(2000).optional(),
});

// GET /api/conversations — list all my conversations with last message + unread count
export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;

  const rows = await db
    .select({ conv: conversations })
    .from(conversations)
    .where(or(eq(conversations.participantA, uid), eq(conversations.participantB, uid)))
    .orderBy(desc(conversations.lastMessageAt));

  if (!rows.length) return NextResponse.json({ conversations: [], unreadTotal: 0 });

  const convIds = rows.map((r) => r.conv.id);

  // Last message + unread count per conversation
  const [lastMsgs, unreadCounts] = await Promise.all([
    db
      .select({ conversationId: messages.conversationId, body: messages.body, sentAt: messages.sentAt, senderId: messages.senderId })
      .from(messages)
      .where(inArray(messages.conversationId, convIds))
      .orderBy(desc(messages.sentAt))
      .limit(convIds.length * 2), // rough upper bound — we pick first per conv below

    db
      .select({ conversationId: messages.conversationId, n: count(messages.id) })
      .from(messages)
      .where(and(
        inArray(messages.conversationId, convIds),
        sql`${messages.senderId} != ${uid}`,
        sql`${messages.readAt} IS NULL`,
      ))
      .groupBy(messages.conversationId),
  ]);

  const lastMsgMap: Record<string, typeof lastMsgs[0]> = {};
  for (const m of lastMsgs) {
    if (!lastMsgMap[m.conversationId]) lastMsgMap[m.conversationId] = m;
  }
  const unreadMap: Record<string, number> = Object.fromEntries(
    unreadCounts.map((u) => [u.conversationId, u.n])
  );

  // Fetch the other participant for each conversation
  const otherIds = rows.map((r) => r.conv.participantA === uid ? r.conv.participantB : r.conv.participantA);
  const uniqueOtherIds = [...new Set(otherIds)];
  const others = uniqueOtherIds.length
    ? await db
        .select({ id: userTable.id, name: userTable.name, displayName: userTable.displayName, image: userTable.image })
        .from(userTable)
        .where(inArray(userTable.id, uniqueOtherIds))
    : [];
  const otherMap = Object.fromEntries(others.map((u) => [u.id, u]));

  // Optionally fetch listing card name for context
  const listingIds = [...new Set(rows.map((r) => r.conv.listingId).filter(Boolean) as string[])];
  const listingCards = listingIds.length
    ? await db
        .select({ listingId: listings.id, name: cardCatalog.name })
        .from(listings)
        .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
        .where(inArray(listings.id, listingIds))
    : [];
  const listingCardMap = Object.fromEntries(listingCards.map((l) => [l.listingId, l.name]));

  const result = rows.map((r) => {
    const otherId = r.conv.participantA === uid ? r.conv.participantB : r.conv.participantA;
    return {
      ...r.conv,
      other:        otherMap[otherId],
      lastMessage:  lastMsgMap[r.conv.id] ?? null,
      unread:       unreadMap[r.conv.id] ?? 0,
      listingCard:  r.conv.listingId ? listingCardMap[r.conv.listingId] : null,
    };
  });

  const unreadTotal = result.reduce((s, c) => s + c.unread, 0);
  return NextResponse.json({ conversations: result, unreadTotal });
}

// POST /api/conversations — find or create a conversation, optionally send first message
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { recipientId, listingId, firstMessage } = parsed.data;
  const uid = session.user.id;

  if (uid === recipientId) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

  // Block check — either direction
  const blockRows = await db
    .select({ id: blockedUsers.id })
    .from(blockedUsers)
    .where(
      or(
        and(eq(blockedUsers.blockerId, uid),         eq(blockedUsers.blockedId, recipientId)),
        and(eq(blockedUsers.blockerId, recipientId), eq(blockedUsers.blockedId, uid)),
      )
    )
    .limit(1);
  if (blockRows.length) {
    return NextResponse.json({ error: "Cannot start a conversation with this user" }, { status: 403 });
  }

  // Normalise participant order
  const [pA, pB] = uid < recipientId ? [uid, recipientId] : [recipientId, uid];

  // Find existing conversation
  const existing = await db
    .select()
    .from(conversations)
    .where(and(
      eq(conversations.participantA, pA),
      eq(conversations.participantB, pB),
      listingId ? eq(conversations.listingId, listingId) : sql`${conversations.listingId} IS NULL`,
    ))
    .limit(1);

  let conv = existing[0];

  if (!conv) {
    const [inserted] = await db
      .insert(conversations)
      .values({ participantA: pA, participantB: pB, listingId: listingId ?? null, lastMessageAt: new Date() })
      .returning();
    conv = inserted;
  }

  if (firstMessage) {
    await db.insert(messages).values({
      conversationId: conv.id,
      senderId:       uid,
      body:           firstMessage,
    });
    await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conv.id));
  }

  return NextResponse.json({ conversation: conv }, { status: conv ? 200 : 201 });
}
