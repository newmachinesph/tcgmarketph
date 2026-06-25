import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as authSchema from "@/db/schema/auth";
import * as cardsSchema from "@/db/schema/cards";
import * as transactionsSchema from "@/db/schema/transactions";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — check your environment variables");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema: { ...authSchema, ...cardsSchema, ...transactionsSchema } });
