import { pgTable, pgEnum, text, numeric, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";

export const wantedStatusEnum = pgEnum("wanted_status", ["open", "filled", "cancelled", "expired"]);

export const wantedListings = pgTable(
  "wanted_listings",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // What they want
    game:        text("game").notNull(),         // "pokemon" | "one_piece" | "any"
    cardName:    text("card_name").notNull(),
    setName:     text("set_name"),

    // Acceptable conditions — comma-separated condition keys, or "any"
    condition:   text("condition").notNull().default("any"),

    // Budget
    maxPricePHP: numeric("max_price_php", { precision: 10, scale: 2 }),
    negotiable:  boolean("negotiable").notNull().default(true),

    notes:  text("notes"),
    status: wantedStatusEnum("status").notNull().default("open"),

    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("wanted_user_idx").on(t.userId),
    index("wanted_status_idx").on(t.status),
    index("wanted_game_idx").on(t.game),
    index("wanted_expires_idx").on(t.expiresAt),
  ]
);

export type WantedListing    = typeof wantedListings.$inferSelect;
export type NewWantedListing = typeof wantedListings.$inferInsert;
