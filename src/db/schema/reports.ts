import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { user } from "./auth";

export const reportTargetTypeEnum = pgEnum("report_target_type", [
  "user",
  "listing",
  "message",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const adminActionTypeEnum = pgEnum("admin_action_type", [
  "ban_user",
  "unban_user",
  "takedown_listing",
  "restore_listing",
  "resolve_report",
  "dismiss_report",
  "warn_user",
]);

export const reports = pgTable(
  "reports",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: reportTargetTypeEnum("target_type").notNull(),
    targetId:   text("target_id").notNull(),
    reason:     text("reason").notNull(),
    details:    text("details"),
    status:     reportStatusEnum("status").notNull().default("open"),
    resolvedBy: text("resolved_by").references(() => user.id),
    resolvedAt: timestamp("resolved_at"),
    createdAt:  timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("report_status_idx").on(t.status),
    index("report_target_idx").on(t.targetType, t.targetId),
    index("report_reporter_idx").on(t.reporterId),
  ]
);

export const adminActions = pgTable(
  "admin_actions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    adminId:    text("admin_id")
      .notNull()
      .references(() => user.id),
    actionType: adminActionTypeEnum("action_type").notNull(),
    targetType: text("target_type").notNull(),
    targetId:   text("target_id").notNull(),
    note:       text("note"),
    createdAt:  timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("admin_action_admin_idx").on(t.adminId),
    index("admin_action_target_idx").on(t.targetType, t.targetId),
  ]
);
