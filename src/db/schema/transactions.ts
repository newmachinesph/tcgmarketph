import {
  pgTable,
  pgEnum,
  text,
  numeric,
  timestamp,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";
import { listings } from "./listings";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const transactionMethodEnum = pgEnum("transaction_method", [
  "cash_meetup",
  "online",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",    // buyer committed, awaiting seller confirmation
  "agreed",     // seller confirmed; listing sold/decremented
  "completed",  // meetup happened, marked done
  "cancelled",  // either party cancelled before meetup
  "no_show",    // someone didn't appear
  "disputed",   // Phase 7
]);

export const meetupStatusEnum = pgEnum("meetup_status", [
  "pending",
  "accepted",
  "declined",
]);

// ── transactions ──────────────────────────────────────────────────────────────

/**
 * transactions — a buyer's commitment to purchase a fixed-price listing.
 *
 * agreedPrice is locked at the listing's price at the moment of purchase.
 * quantity is how many copies of the listing the buyer wants (≤ listing.quantity).
 * When status moves to "agreed", the listing's quantity is decremented and the
 * listing is marked "sold" if it reaches zero.
 */
export const transactions = pgTable(
  "transactions",
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

    agreedPrice: numeric("agreed_price", { precision: 10, scale: 2 }).notNull(),
    quantity:    integer("quantity").notNull().default(1),
    method:      transactionMethodEnum("method").notNull().default("cash_meetup"),
    status:      transactionStatusEnum("status").notNull().default("pending"),

    buyerNote:    text("buyer_note"),
    cancelReason: text("cancel_reason"),

    // PayMongo online payment
    paymongoLinkId:      text("paymongo_link_id"),
    paymongoCheckoutUrl: text("paymongo_checkout_url"),
    paidAt:              timestamp("paid_at"),

    // Dispute resolution (set by admin)
    resolvedBy:   text("resolved_by").references(() => user.id),
    resolvedAt:   timestamp("resolved_at"),
    adminNote:    text("admin_note"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("txn_listing_idx").on(t.listingId),
    index("txn_buyer_idx").on(t.buyerId),
    index("txn_seller_idx").on(t.sellerId),
    index("txn_status_idx").on(t.status),
  ]
);

export type Transaction    = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

// ── meetup_proposals ──────────────────────────────────────────────────────────

/**
 * meetup_proposals — a location + time suggestion from one party to the other.
 *
 * Either buyer or seller can propose. The other party accepts or declines.
 * Multiple proposals per transaction are allowed (negotiating the spot).
 * The latest accepted proposal is what both parties should honour.
 */
export const meetupProposals = pgTable(
  "meetup_proposals",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),

    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),

    proposerId: text("proposer_id")
      .notNull()
      .references(() => user.id),

    location:   text("location").notNull(),
    proposedAt: timestamp("proposed_at").notNull(), // the suggested meetup date/time
    status:     meetupStatusEnum("status").notNull().default("pending"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("meetup_txn_idx").on(t.transactionId),
  ]
);

export type MeetupProposal    = typeof meetupProposals.$inferSelect;
export type NewMeetupProposal = typeof meetupProposals.$inferInsert;
