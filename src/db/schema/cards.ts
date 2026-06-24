import {
  pgTable,
  pgEnum,
  text,
  numeric,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// The two games supported in this first phase. Extend this enum as new games launch.
export const gameEnum = pgEnum("game", ["pokemon", "one_piece"]);

/**
 * card_catalog — shared, canonical card data for every game.
 *
 * One row per real-world card. All users' collections and wishlists point here.
 * A card is stored exactly once, identified by (external_source, external_id).
 *
 * Card facts (name, set, art) are permanent once saved.
 * Only market_price changes — and only via the scheduled price-refresh job.
 *
 * The pg_trgm GIN index on `name` lives in the 0001 migration (not managed by
 * Drizzle) because drizzle-kit can't serialize gin_trgm_ops operator classes.
 * All fuzzy-search queries use raw SQL with similarity().
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

    // Current market price in PHP. Refreshed on a schedule, never on every search.
    marketPrice: numeric("market_price", { precision: 10, scale: 2 }),
    priceUpdatedAt: timestamp("price_updated_at"),

    // Reference back to the source API so we can refresh prices and avoid duplicates.
    externalId: text("external_id").notNull(),
    externalSource: text("external_source").notNull(), // 'pokemon-tcg' | 'one-piece-tcg'

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // Deduplication: the same card from the same API source is stored exactly once.
    uniqueIndex("card_catalog_source_id_idx").on(
      table.externalSource,
      table.externalId
    ),
    // Fast filter when showing "My Collection" or "Wishlist" for a specific game.
    index("card_catalog_game_idx").on(table.game),
    // Fuzzy name search index is created in migration 0001 via raw SQL:
    // CREATE INDEX card_catalog_name_trgm_idx ON card_catalog USING gin (name gin_trgm_ops);
  ]
);

export type CardCatalog = typeof cardCatalog.$inferSelect;
export type NewCardCatalog = typeof cardCatalog.$inferInsert;
