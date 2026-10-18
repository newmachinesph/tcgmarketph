import {
  pgTable,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";
import { transactions } from "./transactions";

export const ratings = pgTable(
  "ratings",
  {
    id:            text("id").primaryKey().$defaultFn(() => createId()),
    transactionId: text("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
    raterId:       text("rater_id").notNull().references(() => user.id),
    rateeId:       text("ratee_id").notNull().references(() => user.id),
    score:         integer("score").notNull(), // 1–5
    comment:       text("comment"),
    createdAt:     timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("rating_txn_rater_idx").on(t.transactionId, t.raterId),
    index("rating_ratee_idx").on(t.rateeId),
    index("rating_rater_idx").on(t.raterId),
  ]
);

export type Rating    = typeof ratings.$inferSelect;
export type NewRating = typeof ratings.$inferInsert;
