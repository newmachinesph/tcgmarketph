import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";

export const blockedUsers = pgTable(
  "blocked_users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    blockerId: text("blocker_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blockedId: text("blocked_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("block_pair_idx").on(t.blockerId, t.blockedId),
    index("block_blocker_idx").on(t.blockerId),
  ]
);
