import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { readFileSync } from "fs";

const __dir = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually
const envLines = readFileSync(resolve(__dir, "../.env.local"), "utf8").split(/\r?\n/);
const env = {};
for (const line of envLines) {
  const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const rawUrl = (env.DATABASE_URL ?? "").replace(/[&?]channel_binding=[^&]*/g, "");
if (!rawUrl) throw new Error("DATABASE_URL not found in .env.local");
console.log("Connecting to DB host:", new URL(rawUrl).hostname);

const client = new pg.Client({ connectionString: rawUrl });
await client.connect();

import { readdirSync } from "fs";

const drizzleDir = resolve(__dir, "../drizzle");
const sqlFiles = readdirSync(drizzleDir)
  .filter((f) => /^\d{4}_.*\.sql$/.test(f))
  .sort();

for (const file of sqlFiles) {
  console.log(`\n── ${file}`);
  const statements = readFileSync(resolve(drizzleDir, file), "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    console.log("Running:", stmt.slice(0, 80));
    try {
      await client.query(stmt);
      console.log("  ✓ done");
    } catch (e) {
      if (e.message?.includes("already exists") || e.message?.includes("duplicate")) {
        console.log("  ⚠ already applied, skipping");
      } else {
        await client.end();
        throw e;
      }
    }
  }
}
await client.end();
console.log("\nMigration complete.");
