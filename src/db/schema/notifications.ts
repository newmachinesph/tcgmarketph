import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";

export const notificationTypeEnum = pgEnum("notification_type", [
  "offer_received",
  "offer_accepted",
  "offer_declined",
  "offer_countered",
  "auction_won",
  "auction_outbid",
  "transaction_agreed",
  "transaction_completed",
  "message_received",
  "system",
]);

export const notifications = pgTable(
  "notifications",
  {
    id:        text("id").primaryKey().$defaultFn(() => createId()),
    userId:    text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    type:      notificationTypeEnum("type").notNull(),
    title:     text("title").notNull(),
    body:      text("body").notNull(),
    link:      text("link"),
    readAt:    timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("notif_user_idx").on(t.userId),
    index("notif_unread_idx").on(t.userId, t.readAt),
  ]
);
