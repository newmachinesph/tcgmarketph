import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";
import { listings } from "./listings";

// ── conversations ─────────────────────────────────────────────────────────────
// One conversation per (participantA, participantB, listingId) triplet.
// participantA is always the lexicographically smaller user id to enforce uniqueness.

export const conversations = pgTable(
  "conversations",
  {
    id:            text("id").primaryKey().$defaultFn(() => createId()),
    listingId:     text("listing_id").references(() => listings.id, { onDelete: "set null" }),
    participantA:  text("participant_a").notNull().references(() => user.id),
    participantB:  text("participant_b").notNull().references(() => user.id),
    lastMessageAt: timestamp("last_message_at"),
    createdAt:     timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("conv_pair_listing_idx").on(t.participantA, t.participantB, t.listingId),
    index("conv_a_idx").on(t.participantA),
    index("conv_b_idx").on(t.participantB),
  ]
);

export type Conversation    = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

// ── messages ──────────────────────────────────────────────────────────────────

export const messages = pgTable(
  "messages",
  {
    id:             text("id").primaryKey().$defaultFn(() => createId()),
    conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderId:       text("sender_id").notNull().references(() => user.id),
    body:           text("body").notNull(),
    sentAt:         timestamp("sent_at").notNull().defaultNow(),
    readAt:         timestamp("read_at"),
  },
  (t) => [
    index("msg_conv_idx").on(t.conversationId),
    index("msg_sender_idx").on(t.senderId),
    index("msg_sent_idx").on(t.sentAt),
  ]
);

export type Message    = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
