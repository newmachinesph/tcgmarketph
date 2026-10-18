import {
  pgTable,
  pgEnum,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";
import { listings } from "./listings";

export const offerStatusEnum = pgEnum("offer_status", [
  "pending",    // awaiting seller response
  "accepted",   // seller accepted → transaction created
  "declined",   // seller declined
  "countered",  // seller proposed a different price
  "cancelled",  // buyer cancelled
  "expired",    // 48 h elapsed without response
]);

/**
 * offers — a buyer's price proposal on a fixed-price listing.
 *
 * Seller can accept (creates a transaction), decline, or counter.
 * When countered, the buyer can accept_counter or decline_counter.
 * One open offer per buyer per listing enforced at API layer.
 * Expires 48 h after creation via the expire-offers Inngest job.
 */
export const offers = pgTable(
  "offers",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),

    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id),

    buyerId: text("buyer_id")
      .notNull()
      .references(() => user.id),

    sellerId: text("seller_id")
      .notNull()
      .references(() => user.id),

    offeredPrice:   numeric("offered_price",  { precision: 10, scale: 2 }).notNull(),
    message:        text("message"),

    // Set by seller when status = "countered"
    counterPrice:   numeric("counter_price",  { precision: 10, scale: 2 }),
    counterMessage: text("counter_message"),

    // Set when accepted → points to the resulting transaction
    transactionId: text("transaction_id"),

    status:    offerStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at").notNull(), // 48 h from creation

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("offer_listing_idx").on(t.listingId),
    index("offer_buyer_idx").on(t.buyerId),
    index("offer_seller_idx").on(t.sellerId),
    index("offer_status_idx").on(t.status),
    index("offer_expires_idx").on(t.expiresAt),
  ]
);

export type Offer    = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
