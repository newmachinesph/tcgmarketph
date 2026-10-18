import {
  pgTable,
  text,
  numeric,
  timestamp,
  uniqueIndex,
  index,
  json,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";
import { listings } from "./listings";

export type SavedSearchQuery = {
  q?:         string;
  game?:      string;
  condition?: string;
  minPrice?:  string;
  maxPrice?:  string;
};

export const savedSearches = pgTable(
  "saved_searches",
  {
    id:             text("id").primaryKey().$defaultFn(() => createId()),
    userId:         text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    name:           text("name").notNull(),
    query:          json("query").$type<SavedSearchQuery>().notNull(),
    lastNotifiedAt: timestamp("last_notified_at"),
    createdAt:      timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ss_user_idx").on(t.userId),
  ]
);

export const priceAlerts = pgTable(
  "price_alerts",
  {
    id:          text("id").primaryKey().$defaultFn(() => createId()),
    userId:      text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    listingId:   text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
    targetPrice: numeric("target_price", { precision: 10, scale: 2 }).notNull(),
    triggeredAt: timestamp("triggered_at"),
    createdAt:   timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("pa_user_listing_idx").on(t.userId, t.listingId),
    index("pa_listing_idx").on(t.listingId),
  ]
);

export type SavedSearch    = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
export type PriceAlert     = typeof priceAlerts.$inferSelect;
export type NewPriceAlert  = typeof priceAlerts.$inferInsert;
