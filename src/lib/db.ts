import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as authSchema from "@/db/schema/auth";
import * as cardsSchema from "@/db/schema/cards";
import * as listingsSchema from "@/db/schema/listings";
import * as transactionsSchema from "@/db/schema/transactions";
import * as offersSchema from "@/db/schema/offers";
import * as ratingsSchema from "@/db/schema/ratings";
import * as messagesSchema from "@/db/schema/messages";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — check your environment variables");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, {
  schema: {
    ...authSchema,
    ...cardsSchema,
    ...listingsSchema,
    ...transactionsSchema,
    ...offersSchema,
    ...ratingsSchema,
    ...messagesSchema,
  },
});
