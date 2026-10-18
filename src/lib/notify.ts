import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/db/schema/notifications";
import { user as userTable } from "@/db/schema/auth";

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

// Notification types that warrant an SMS alert
const SMS_TYPES = new Set<NotificationType>([
  "offer_received",
  "offer_accepted",
  "offer_declined",
  "offer_countered",
  "auction_won",
  "auction_outbid",
  "transaction_agreed",
  "transaction_completed",
]);

function normalizePhone(ph: string): string {
  if (ph.startsWith("+63")) return ph;
  if (ph.startsWith("09")) return "+63" + ph.slice(1);
  return ph;
}

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

  // Real-time delivery via Ably — fire and forget
  publishToAbly(`notifications:${userId}`, "notification", notif).catch(() => {});

  // SMS delivery for transactional alerts — fire and forget
  if (SMS_TYPES.has(type)) {
    sendSmsNotification(userId, title, body).catch(() => {});
  }

  // Web push — fire and forget
  import("@/lib/webpush")
    .then(({ sendWebPushToUser }) =>
      sendWebPushToUser(userId, { title, body, url: link })
    )
    .catch(() => {});

  return notif;
}

async function sendSmsNotification(userId: string, title: string, body: string) {
  try {
    const u = await db
      .select({
        phone:            userTable.phone,
        phoneVerified:    userTable.phoneVerified,
        smsNotifications: userTable.smsNotifications,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .then((r) => r[0]);

    if (!u?.phone || !u.phoneVerified || !u.smsNotifications) return;

    const { sendSms } = await import("@/lib/sms");
    await sendSms({
      to:      normalizePhone(u.phone),
      message: `TCGMarket PH: ${title} — ${body}`,
    });
  } catch {
    // non-fatal — in-app notification already created
  }
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
