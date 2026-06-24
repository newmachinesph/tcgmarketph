/**
 * One-time setup: enable pg_trgm in Neon.
 *
 * Run before drizzle-kit push if the card_catalog GIN index
 * hasn't been created yet:
 *
 *   node --env-file=.env.local scripts/enable-pg-extensions.mjs
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Load .env.local when running outside Next.js
try {
  const env = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.trim().match(/^([^#=][^=]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* absent — rely on process.env */ }

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(url);

await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
console.log("✓  pg_trgm extension enabled");

// Also create the GIN index if it doesn't exist yet.
// This must run AFTER drizzle-kit creates the card_catalog table.
await sql`
  CREATE INDEX IF NOT EXISTS card_catalog_name_trgm_idx
  ON card_catalog
  USING gin (name gin_trgm_ops)
`;
console.log("✓  card_catalog_name_trgm_idx (GIN) created");
