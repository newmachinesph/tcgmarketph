import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uniqueIndex,
  index,
  json,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// ---------- Enums ----------

export const kycStatusEnum = pgEnum("kyc_status", [
  "none",
  "pending",
  "verified",
  "rejected",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "power_seller",
]);

// =============================================================
// TYPES
// =============================================================

export type EmailPrefs = {
  offers:       boolean;
  messages:     boolean;
  wishlist:     boolean;
  transactions: boolean;
};

// =============================================================
// USER
// =============================================================

export const user = pgTable(
  "user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),

    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),

    displayName: text("display_name"),
    username: text("username"),
    phone: text("phone"),
    phoneVerified: boolean("phone_verified").notNull().default(false),

    city: text("city"),
    bio: text("bio"),
    games: text("games"), // comma-separated: "pokemon,one_piece"

    kycStatus: kycStatusEnum("kyc_status").notNull().default("none"),
    sellerEnabled: boolean("seller_enabled").notNull().default(false),
    subscriptionTier: subscriptionTierEnum("subscription_tier")
      .notNull()
      .default("free"),
    isAdmin: boolean("is_admin").notNull().default(false),

    subscriptionExpiresAt: timestamp("subscription_expires_at"),

    reputationScore: integer("reputation_score").notNull().default(0),
    noShowCount:     integer("no_show_count").notNull().default(0),

    preferredCurrency: text("preferred_currency").notNull().default("PHP"),
    collectionPublic:  boolean("collection_public").notNull().default(false),
    smsNotifications:  boolean("sms_notifications").notNull().default(false),

    emailPrefs: json("email_prefs").$type<EmailPrefs>(),

    isBanned: boolean("is_banned").notNull().default(false),
    bannedReason: text("banned_reason"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    emailIdx:    uniqueIndex("user_email_idx").on(t.email),
    phoneIdx:    index("user_phone_idx").on(t.phone),
    usernameIdx: uniqueIndex("user_username_idx").on(t.username),
  })
);

// =============================================================
// SESSION
// =============================================================

export const session = pgTable(
  "session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),

    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    tokenIdx: uniqueIndex("session_token_idx").on(t.token),
    userIdx: index("session_user_idx").on(t.userId),
  })
);

// =============================================================
// ACCOUNT
// =============================================================

export const account = pgTable(
  "account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),

    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),

    password: text("password"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    providerIdx: uniqueIndex("account_provider_idx").on(
      t.providerId,
      t.accountId
    ),
    userIdx: index("account_user_idx").on(t.userId),
  })
);

// =============================================================
// VERIFICATION
// =============================================================

export const verification = pgTable(
  "verification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    identifierIdx: index("verification_identifier_idx").on(t.identifier),
  })
);

// =============================================================
// PHONE_OTP (Phase 7)
// =============================================================

export const phoneOtp = pgTable(
  "phone_otp",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    attempts: integer("attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("phone_otp_user_idx").on(t.userId),
    phoneIdx: index("phone_otp_phone_idx").on(t.phone),
  })
);

// =============================================================
// KYC_VERIFICATION (Phase 7)
// =============================================================

export const kycVerification = pgTable(
  "kyc_verification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    diditSessionId: text("didit_session_id"),
    status: kycStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    rawPayload: text("raw_payload"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    userIdx: index("kyc_user_idx").on(t.userId),
    sessionIdx: index("kyc_session_idx").on(t.diditSessionId),
  })
);
