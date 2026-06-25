import {
  pgTable,
  pgEnum,
  text,
  numeric,
  timestamp,
  index,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";
import { cardCatalog, conditionEnum, gradingCompanyEnum, userCollection } from "./cards";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const listingTypeEnum = pgEnum("listing_type", [
  "fixed_price",
  "auction", // used from Phase 5
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "paused",
  "sold",
  "cancelled",
  "expired",
]);

// ── listings ──────────────────────────────────────────────────────────────────

/**
 * listings — a card a seller is offering for sale or auction.
 *
 * Card identity comes from card_catalog. Photos are separate (listing_photos).
 * Price is always in PHP — this is a cash-on-meetup PH marketplace.
 *
 * source_collection_id is set when the listing is created from a collection
 * entry ("list this card" flow) so condition/grade can be pre-filled.
 */
export const listings = pgTable(
  "listings",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),

    sellerId: text("seller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    cardId: text("card_id")
      .notNull()
      .references(() => cardCatalog.id),

    // Card physical details at time of listing
    condition:      conditionEnum("condition").notNull().default("near_mint"),
    isGraded:       boolean("is_graded").notNull().default(false),
    gradingCompany: gradingCompanyEnum("grading_company").notNull().default("none"),
    gradeValue:     numeric("grade_value", { precision: 4, scale: 1 }),
    isFoil:         boolean("is_foil").notNull().default(false),
    isFirstEdition: boolean("is_first_edition").notNull().default(false),

    // Listing details
    type:        listingTypeEnum("type").notNull().default("fixed_price"),
    price:       numeric("price", { precision: 10, scale: 2 }).notNull(), // PHP
    quantity:    integer("quantity").notNull().default(1),
    description: text("description"),

    // Status & lifecycle
    status:    listingStatusEnum("status").notNull().default("active"),
    expiresAt: timestamp("expires_at").notNull(), // 30 days from creation

    // Optional link back to the collection entry this was created from
    sourceCollectionId: text("source_collection_id")
      .references(() => userCollection.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("listing_seller_idx").on(t.sellerId),
    index("listing_card_idx").on(t.cardId),
    index("listing_status_idx").on(t.status),
    index("listing_expires_idx").on(t.expiresAt),
  ]
);

export type Listing    = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;

// ── listing_photos ────────────────────────────────────────────────────────────

/**
 * listing_photos — the seller's real photos of their actual card.
 *
 * Uploaded via UploadThing. Never reuse catalog art here — these must be
 * the seller's own photos proving the card's actual condition.
 *
 * `order` controls display sequence (0 = cover photo).
 */
export const listingPhotos = pgTable(
  "listing_photos",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),

    listingId: text("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),

    url:   text("url").notNull(),
    order: integer("order").notNull().default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("listing_photo_listing_idx").on(t.listingId),
  ]
);

export type ListingPhoto    = typeof listingPhotos.$inferSelect;
export type NewListingPhoto = typeof listingPhotos.$inferInsert;
