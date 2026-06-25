import {
  pgTable,
  pgEnum,
  text,
  numeric,
  timestamp,
  index,
  uniqueIndex,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";

// ── Game enum ─────────────────────────────────────────────────────────────────
// The two games supported in this first phase. Extend as new games launch.
export const gameEnum = pgEnum("game", ["pokemon", "one_piece"]);

// ── Condition enums ───────────────────────────────────────────────────────────

/** Raw condition — the 5-tier standard, best → worst. Default: near_mint. */
export const conditionEnum = pgEnum("card_condition", [
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
]);

/**
 * Professional grading companies.
 * "none" = raw/ungraded. When set to psa/bgs/cgc, gradeValue carries the
 * numeric score and raw condition becomes secondary.
 */
export const gradingCompanyEnum = pgEnum("grading_company", [
  "none",
  "psa",
  "bgs",
  "cgc",
]);

// ── card_catalog ──────────────────────────────────────────────────────────────

/**
 * card_catalog — shared, canonical card data for every game.
 *
 * One row per real-world card. All users' collections and wishlists point here.
 * A card is stored exactly once, identified by (external_source, external_id).
 *
 * Card facts (name, set, art) are permanent once saved.
 * Only market_price changes — and only via the scheduled price-refresh job.
 *
 * The pg_trgm GIN index on `name` lives in migration 0000 (not managed by
 * Drizzle) because drizzle-kit can't serialize gin_trgm_ops operator classes.
 */
export const cardCatalog = pgTable(
  "card_catalog",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    game: gameEnum("game").notNull(),
    name: text("name").notNull(),
    setName: text("set_name"),
    setCode: text("set_code"),
    cardNumber: text("card_number"),
    rarity: text("rarity"),
    language: text("language").default("en").notNull(),
    imageUrl: text("image_url"),

    // Current market price (USD from tcgapi.dev). Refreshed on a schedule.
    marketPrice: numeric("market_price", { precision: 10, scale: 2 }),
    priceUpdatedAt: timestamp("price_updated_at"),

    externalId: text("external_id").notNull(),
    externalSource: text("external_source").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("card_catalog_source_id_idx").on(
      table.externalSource,
      table.externalId
    ),
    index("card_catalog_game_idx").on(table.game),
    // GIN trgm index created via raw SQL in migration 0000
  ]
);

export type CardCatalog    = typeof cardCatalog.$inferSelect;
export type NewCardCatalog = typeof cardCatalog.$inferInsert;

// ── user_collection ───────────────────────────────────────────────────────────

/**
 * user_collection — every card a user owns.
 *
 * Multiple entries for the same card are allowed (e.g. one NM and one HP
 * copy, or a raw NM and a PSA 10 slab — those are separate entries).
 *
 * Two parallel systems track condition:
 *   - condition:       raw 5-tier (always stored; relevant when grading_company = "none")
 *   - gradingCompany + gradeValue: professional grade (only for slabbed cards)
 */
export const userCollection = pgTable(
  "user_collection",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    cardId: text("card_id")
      .notNull()
      .references(() => cardCatalog.id, { onDelete: "cascade" }),

    quantity: integer("quantity").default(1).notNull(),

    condition: conditionEnum("condition").default("near_mint").notNull(),

    gradingCompany: gradingCompanyEnum("grading_company").default("none").notNull(),
    // Numeric grade: 10 = Gem Mint (PSA/BGS), 9.5 = Gem Mint (BGS), etc.
    gradeValue: numeric("grade_value", { precision: 4, scale: 1 }),

    isFoil: boolean("is_foil").default(false).notNull(),
    isFirstEdition: boolean("is_first_edition").default(false).notNull(),
    language: text("language").default("en").notNull(),

    purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }),
    purchaseDate:  timestamp("purchase_date"),
    notes:         text("notes"),
    isFavorite:    boolean("is_favorite").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("collection_user_idx").on(table.userId),
    index("collection_card_idx").on(table.cardId),
  ]
);

export type UserCollection    = typeof userCollection.$inferSelect;
export type NewUserCollection = typeof userCollection.$inferInsert;

// ── user_wishlist ─────────────────────────────────────────────────────────────

export const wishlistPriorityEnum = pgEnum("wishlist_priority", [
  "low",
  "medium",
  "high",
]);

/**
 * user_wishlist — cards the user wants to acquire.
 *
 * One entry per card per user (unique constraint). A card moves off the
 * wishlist when the user adds it to their collection (UI action, not automatic).
 */
export const userWishlist = pgTable(
  "user_wishlist",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    cardId: text("card_id")
      .notNull()
      .references(() => cardCatalog.id, { onDelete: "cascade" }),

    priority: wishlistPriorityEnum("priority").default("medium").notNull(),

    // Maximum price the user is willing to pay (PHP)
    maxBuyPrice: numeric("max_buy_price", { precision: 10, scale: 2 }),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("wishlist_user_card_idx").on(table.userId, table.cardId),
    index("wishlist_user_idx").on(table.userId),
  ]
);

export type UserWishlist    = typeof userWishlist.$inferSelect;
export type NewUserWishlist = typeof userWishlist.$inferInsert;
