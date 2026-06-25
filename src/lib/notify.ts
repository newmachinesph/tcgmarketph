import { db } from "@/lib/db";
import { notifications } from "@/db/schema/notifications";

type NotificationType =
  | "offer_received"
  | "offer_accepted"
  | "offer_declined"
  | "offer_countered"
  | "auction_won"
  | "auction_outbid"
  | "transaction_agreed"
  | "transaction_completed"
  | "message_received"
  | "wishlist_match"
  | "system";

export async function createNotification(
  userId:  string,
  type:    NotificationType,
  title:   string,
  body:    string,
  link?:   string,
) {
  const [notif] = await db
    .insert(notifications)
    .values({ userId, type, title, body, link: link ?? null })
    .returning();

  // Publish to Ably for real-time delivery — fire and forget
  publishToAbly(`notifications:${userId}`, "notification", notif).catch(() => {});

  return notif;
}

async function publishToAbly(channel: string, event: string, payload: object) {
  try {
    const { default: Ably } = await import("ably");
    const key = process.env.ABLY_API_KEY;
    if (!key) return;
    const client = new Ably.Realtime({ key });
    await client.channels.get(channel).publish(event, payload);
    client.close();
  } catch {
    // non-fatal
  }
}
