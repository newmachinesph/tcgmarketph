import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and, or, asc, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { conversations, messages } from "@/db/schema/messages";
import { blockedUsers } from "@/db/schema/blocks";
import { publishBid } from "@/lib/ably";
import { messageRatelimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

const sendSchema = z.object({ body: z.string().min(1).max(2000) });

// GET /api/conversations/[id]/messages — full message history + mark unread as read
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.participantA !== uid && conv.participantB !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Mark messages from the other person as read
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(
      eq(messages.conversationId, id),
      sql`${messages.senderId} != ${uid}`,
      sql`${messages.readAt} IS NULL`,
    ));

  const rows = await db
    .select({
      msg: messages,
      sender: {
        id:          userTable.id,
        name:        userTable.name,
        displayName: userTable.displayName,
        image:       userTable.image,
      },
    })
    .from(messages)
    .innerJoin(userTable, eq(messages.senderId, userTable.id))
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.sentAt))
    .limit(200);

  const otherId = conv.participantA === uid ? conv.participantB : conv.participantA;
  const [other] = await db
    .select({ id: userTable.id, name: userTable.name, displayName: userTable.displayName, image: userTable.image })
    .from(userTable)
    .where(eq(userTable.id, otherId));

  return NextResponse.json({
    conversation: { ...conv, other },
    messages: rows.map((r) => ({ ...r.msg, sender: r.sender })),
  });
}

// POST /api/conversations/[id]/messages — send a message
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit
  if (messageRatelimit) {
    const { success } = await messageRatelimit.limit(session.user.id);
    if (!success) return NextResponse.json({ error: "Too many messages — slow down" }, { status: 429 });
  }

  const uid = session.user.id;

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.participantA !== uid && conv.participantB !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Block check — if the other party has blocked the sender (or vice versa)
  const otherId = conv.participantA === uid ? conv.participantB : conv.participantA;
  const blockRows = await db
    .select({ id: blockedUsers.id })
    .from(blockedUsers)
    .where(
      or(
        and(eq(blockedUsers.blockerId, otherId), eq(blockedUsers.blockedId, uid)),
        and(eq(blockedUsers.blockerId, uid),     eq(blockedUsers.blockedId, otherId)),
      )
    )
    .limit(1);
  if (blockRows.length) {
    return NextResponse.json({ error: "Cannot send messages in this conversation" }, { status: 403 });
  }

  const body   = await request.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [msg] = await db
    .insert(messages)
    .values({ conversationId: id, senderId: uid, body: parsed.data.body })
    .returning();

  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, id));

  // Publish to Ably for real-time delivery
  const senderName = session.user.displayName ?? session.user.name;
  await publishChatMessage(id, {
    id:         msg.id,
    senderId:   uid,
    senderName,
    body:       msg.body,
    sentAt:     msg.sentAt.toISOString(),
  });

  return NextResponse.json({ message: { ...msg, senderName } }, { status: 201 });
}

async function publishChatMessage(conversationId: string, payload: object) {
  // Reuse the Ably server client from lib/ably but on a different channel
  try {
    const { default: Ably } = await import("ably");
    const key = process.env.ABLY_API_KEY;
    if (!key) return;
    const client  = new Ably.Realtime({ key });
    const channel = client.channels.get(`chat:${conversationId}`);
    await channel.publish("message", payload);
    client.close();
  } catch {
    // non-fatal
  }
}
