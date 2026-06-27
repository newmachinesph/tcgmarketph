import { readFileSync } from "fs";
import { join }         from "path";
try {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.trim().match(/^([^#=][^=]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* rely on existing env */ }

import { db }            from "../src/lib/db";
import { listings }      from "../src/db/schema/listings";
import { cardCatalog }   from "../src/db/schema/cards";
import { eq, isNull }    from "drizzle-orm";
import { toListingSlug } from "../src/lib/utils/slug";

async function main() {
  const rows = await db
    .select({ id: listings.id, cardName: cardCatalog.name })
    .from(listings)
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .where(isNull(listings.slug));

  console.log(`Found ${rows.length} listing(s) without slugs.`);
  if (rows.length === 0) { console.log("Nothing to do."); process.exit(0); }

  for (const row of rows) {
    const slug = toListingSlug(row.cardName, row.id);
    await db.update(listings).set({ slug }).where(eq(listings.id, row.id));
    console.log(`  ${row.id.slice(0, 8)}… → ${slug}`);
  }

  console.log(`\n✅ Updated ${rows.length} listings.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
