/**
 * findCards — the single entry point for card lookups in the app.
 *
 * Golden rule: always check our DB first.
 * - DB hit  → return immediately, zero API calls.
 * - DB miss → call tcgapi.dev once, upsert the results, return them.
 *   Every card we fetch from the API is saved forever; future searches
 *   are free.
 *
 * A negative cache (Redis, 1 h TTL) prevents repeated API burns for
 * queries that returned nothing.
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cardCatalog } from "@/db/schema/cards";
import { redis } from "@/lib/redis";
import { tcgApiRatelimit } from "@/lib/rate-limit";
import { searchTcgApi } from "./tcgapi";
import type { TcgApiCard, GameKey } from "./tcgapi";
import type { CardCatalog, NewCardCatalog } from "@/db/schema/cards";

export type { CardCatalog };

export interface FindCardsResult {
  cards: CardCatalog[];
  /** true when results came entirely from our DB (no API call was made). */
  fromCache: boolean;
  /** true when we tried the API and it was unreachable/errored. */
  apiUnavailable?: boolean;
}

// ─── Local DB search ──────────────────────────────────────────────────────────

async function searchLocal(query: string, game?: GameKey, limit = 25): Promise<CardCatalog[]> {
  const conditions = [sql`similarity(${cardCatalog.name}, ${query}) > 0.2`];
  if (game) conditions.push(eq(cardCatalog.game, game));

  return db
    .select()
    .from(cardCatalog)
    .where(and(...conditions))
    .orderBy(sql`similarity(${cardCatalog.name}, ${query}) DESC`)
    .limit(limit);
}

// ─── API → DB mapping ─────────────────────────────────────────────────────────

function mapApiCard(card: TcgApiCard, game: GameKey): NewCardCatalog {
  return {
    game,
    name: card.name,
    setName: card.set_name ?? null,
    setCode: null, // tcgapi.dev doesn't return a set code
    cardNumber: card.number ?? null,
    rarity: card.rarity ?? null,
    language: "en",
    imageUrl: card.image_url ?? null,
    // Store USD price as-is; currency conversion belongs in a later phase.
    marketPrice: card.market_price != null ? String(card.market_price) : null,
    priceUpdatedAt: card.price_updated_at ? new Date(card.price_updated_at) : new Date(),
    externalId: String(card.id),
    externalSource: "tcgapi",
  };
}

// ─── Upsert ───────────────────────────────────────────────────────────────────

async function upsertApiCards(
  apiCards: TcgApiCard[],
  game: GameKey
): Promise<CardCatalog[]> {
  if (apiCards.length === 0) return [];

  const rows: NewCardCatalog[] = apiCards.map((c) => mapApiCard(c, game));

  return db
    .insert(cardCatalog)
    .values(rows)
    .onConflictDoUpdate({
      target: [cardCatalog.externalSource, cardCatalog.externalId],
      // Refresh mutable fields on every re-fetch.
      set: {
        name:            sql`excluded.name`,
        setName:         sql`excluded.set_name`,
        cardNumber:      sql`excluded.card_number`,
        rarity:          sql`excluded.rarity`,
        imageUrl:        sql`excluded.image_url`,
        marketPrice:     sql`excluded.market_price`,
        priceUpdatedAt:  sql`excluded.price_updated_at`,
        updatedAt:       sql`now()`,
      },
    })
    .returning();
}

// ─── Negative-miss cache ──────────────────────────────────────────────────────

function missKey(query: string, game?: GameKey) {
  return `tcg:miss:${game ?? "all"}:${query.toLowerCase().trim()}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function findCards(
  query: string,
  game?: GameKey,
  limit = 25
): Promise<FindCardsResult> {
  const q = query.trim();
  if (q.length < 2) return { cards: [], fromCache: true };

  // ── Step 1: Our DB first ─────────────────────────────────────────────────
  const local = await searchLocal(q, game, limit);
  if (local.length > 0) {
    return { cards: local, fromCache: true };
  }

  // ── Step 2: Negative cache — skip API if this exact query already returned nothing ──
  const mk = missKey(q, game);
  const isCachedMiss = await redis.exists(mk);
  if (isCachedMiss) {
    return { cards: [], fromCache: true };
  }

  // ── Step 3: Protect our daily API quota ──────────────────────────────────
  if (tcgApiRatelimit) {
    const { success, remaining } = await tcgApiRatelimit.limit("global");
    if (!success) {
      console.warn("[cards] TCG API daily quota exhausted — returning empty");
      return { cards: [], fromCache: false };
    }
    console.log(`[cards] TCG API call — ${remaining} calls remaining today`);
  }

  // ── Step 4: Call the TCG API ─────────────────────────────────────────────
  const games: GameKey[] = game ? [game] : ["pokemon", "one_piece"];
  const saved: CardCatalog[] = [];

  try {
    for (const g of games) {
      const apiCards = await searchTcgApi(q, g);
      if (apiCards.length > 0) {
        const rows = await upsertApiCards(apiCards, g);
        saved.push(...rows);
      }
    }
  } catch (err) {
    console.error("[cards] TCG API error:", err);
    // Return whatever the local DB has (could be partial results from another game)
    // plus a flag so the UI can show a soft warning.
    return { cards: saved, fromCache: false, apiUnavailable: true };
  }

  // Cache a miss so we don't hit the API again for the same fruitless query.
  if (saved.length === 0) {
    await redis.set(mk, "1", { ex: 3600 }); // 1-hour negative cache
  }

  return { cards: saved.slice(0, limit), fromCache: false };
}
