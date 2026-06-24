/**
 * Seed the card_catalog with a small batch of real Pokémon and One Piece cards
 * so Phase 1 has something to search against.
 *
 *   npm run db:seed
 *   — or —
 *   npx tsx scripts/seed-cards.ts
 */

// Load .env.local for local development (Next.js doesn't auto-load it in scripts)
import { readFileSync } from "fs";
import { join } from "path";
try {
  const env = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.trim().match(/^([^#=][^=]*)=["']?(.+?)["']?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env.local absent — rely on process.env */ }

import { db } from "../src/lib/db";
import { cardCatalog } from "../src/db/schema/cards";
import { sql } from "drizzle-orm";
import type { NewCardCatalog } from "../src/db/schema/cards";

const SEED: NewCardCatalog[] = [
  // ── Pokémon – Base Set ────────────────────────────────────────────────────
  {
    game: "pokemon",
    name: "Charizard",
    setName: "Base Set",
    setCode: "base1",
    cardNumber: "4/102",
    rarity: "Rare Holo",
    language: "en",
    imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
    marketPrice: "18500.00",   // approx PHP
    priceUpdatedAt: new Date(),
    externalId: "base1-4",
    externalSource: "pokemon-tcg",
  },
  {
    game: "pokemon",
    name: "Pikachu",
    setName: "Base Set",
    setCode: "base1",
    cardNumber: "58/102",
    rarity: "Common",
    language: "en",
    imageUrl: "https://images.pokemontcg.io/base1/58_hires.png",
    marketPrice: "620.00",
    priceUpdatedAt: new Date(),
    externalId: "base1-58",
    externalSource: "pokemon-tcg",
  },
  {
    game: "pokemon",
    name: "Mewtwo",
    setName: "Base Set",
    setCode: "base1",
    cardNumber: "10/102",
    rarity: "Rare Holo",
    language: "en",
    imageUrl: "https://images.pokemontcg.io/base1/10_hires.png",
    marketPrice: "4500.00",
    priceUpdatedAt: new Date(),
    externalId: "base1-10",
    externalSource: "pokemon-tcg",
  },
  {
    game: "pokemon",
    name: "Blastoise",
    setName: "Base Set",
    setCode: "base1",
    cardNumber: "2/102",
    rarity: "Rare Holo",
    language: "en",
    imageUrl: "https://images.pokemontcg.io/base1/2_hires.png",
    marketPrice: "6200.00",
    priceUpdatedAt: new Date(),
    externalId: "base1-2",
    externalSource: "pokemon-tcg",
  },
  {
    game: "pokemon",
    name: "Venusaur",
    setName: "Base Set",
    setCode: "base1",
    cardNumber: "15/102",
    rarity: "Rare Holo",
    language: "en",
    imageUrl: "https://images.pokemontcg.io/base1/15_hires.png",
    marketPrice: "4800.00",
    priceUpdatedAt: new Date(),
    externalId: "base1-15",
    externalSource: "pokemon-tcg",
  },
  {
    game: "pokemon",
    name: "Gengar",
    setName: "Fossil",
    setCode: "fossil",
    cardNumber: "5/62",
    rarity: "Rare Holo",
    language: "en",
    imageUrl: "https://images.pokemontcg.io/fossil/5_hires.png",
    marketPrice: "2200.00",
    priceUpdatedAt: new Date(),
    externalId: "fossil-5",
    externalSource: "pokemon-tcg",
  },

  // ── One Piece – Romance Dawn (OP-01) ──────────────────────────────────────
  {
    game: "one_piece",
    name: "Monkey D. Luffy",
    setName: "Romance Dawn",
    setCode: "OP01",
    cardNumber: "OP01-001",
    rarity: "Leader",
    language: "en",
    imageUrl: null,
    marketPrice: "280.00",
    priceUpdatedAt: new Date(),
    externalId: "OP01-001",
    externalSource: "one-piece-tcg",
  },
  {
    game: "one_piece",
    name: "Roronoa Zoro",
    setName: "Romance Dawn",
    setCode: "OP01",
    cardNumber: "OP01-002",
    rarity: "Common",
    language: "en",
    imageUrl: null,
    marketPrice: "95.00",
    priceUpdatedAt: new Date(),
    externalId: "OP01-002",
    externalSource: "one-piece-tcg",
  },
  {
    game: "one_piece",
    name: "Nami",
    setName: "Romance Dawn",
    setCode: "OP01",
    cardNumber: "OP01-016",
    rarity: "Uncommon",
    language: "en",
    imageUrl: null,
    marketPrice: "60.00",
    priceUpdatedAt: new Date(),
    externalId: "OP01-016",
    externalSource: "one-piece-tcg",
  },

  // ── One Piece – Paramount War (OP-02) ─────────────────────────────────────
  {
    game: "one_piece",
    name: "Portgas D. Ace",
    setName: "Paramount War",
    setCode: "OP02",
    cardNumber: "OP02-001",
    rarity: "Leader",
    language: "en",
    imageUrl: null,
    marketPrice: "420.00",
    priceUpdatedAt: new Date(),
    externalId: "OP02-001",
    externalSource: "one-piece-tcg",
  },
  {
    game: "one_piece",
    name: "Trafalgar Law",
    setName: "Paramount War",
    setCode: "OP02",
    cardNumber: "OP02-094",
    rarity: "Secret Rare",
    language: "en",
    imageUrl: null,
    marketPrice: "2400.00",
    priceUpdatedAt: new Date(),
    externalId: "OP02-094",
    externalSource: "one-piece-tcg",
  },
];

async function main() {
  console.log(`Seeding ${SEED.length} cards…`);

  let inserted = 0;
  for (const card of SEED) {
    const rows = await db
      .insert(cardCatalog)
      .values(card)
      .onConflictDoNothing() // idempotent: safe to re-run
      .returning({ id: cardCatalog.id });
    if (rows.length) inserted++;
  }

  console.log(`✓  ${inserted} new rows inserted (${SEED.length - inserted} already existed)`);

  // ── Fuzzy-search demo ─────────────────────────────────────────────────────
  const query = "charzard"; // intentional typo
  console.log(`\nFuzzy search for "${query}":`);

  const hits = await db
    .select({
      name:   cardCatalog.name,
      set:    cardCatalog.setName,
      game:   cardCatalog.game,
      price:  cardCatalog.marketPrice,
      score:  sql<number>`round(similarity(name, ${query})::numeric, 3)`,
    })
    .from(cardCatalog)
    .where(sql`similarity(name, ${query}) > 0.15`)
    .orderBy(sql`similarity(name, ${query}) DESC`)
    .limit(5);

  if (hits.length) {
    console.table(hits);
  } else {
    console.log("No results (is pg_trgm enabled and the GIN index created?)");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
