import { and, inArray, isNull, lt, or } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { cardCatalog, userCollection, userWishlist, priceHistory } from "@/db/schema/cards";
import { fetchCardByExternalId, type GameKey } from "@/lib/cards/tcgapi";
import { tcgApiRatelimit } from "@/lib/rate-limit";

// Maximum cards to refresh per run — keeps API spend inside the 90/day budget.
// Leaves ~40 calls for user-triggered searches.
const MAX_CARDS_PER_RUN = 50;

// Only refresh cards whose price is older than 23 hours.
const STALE_AFTER_MS = 23 * 60 * 60 * 1000;

/**
 * refresh-card-prices — daily scheduled job (03:00 UTC).
 *
 * Finds all cards tracked in any user's collection or wishlist whose market
 * price is stale (>23 h old) or missing. Fetches fresh prices from tcgapi.dev,
 * updates card_catalog, and records a price_history snapshot for each card.
 *
 * Stops early if the API rate-limit budget runs out so user searches always
 * have quota available. Remaining stale cards are picked up the next day.
 */
export const refreshCardPrices = inngest.createFunction(
  {
    id:       "refresh-card-prices",
    name:     "Refresh Card Prices",
    retries:  1,
    triggers: [{ cron: "0 3 * * *" }],
  },
  async ({ step }) => {

    // ── Step 1: collect stale card IDs ────────────────────────────────────────

    const staleCards = await step.run("collect-stale-cards", async () => {
      const staleThreshold = new Date(Date.now() - STALE_AFTER_MS);

      const [collectionCards, wishlistCards] = await Promise.all([
        db.selectDistinct({ cardId: userCollection.cardId }).from(userCollection),
        db.selectDistinct({ cardId: userWishlist.cardId }).from(userWishlist),
      ]);

      const allCardIds = [
        ...new Set([
          ...collectionCards.map((r) => r.cardId),
          ...wishlistCards.map((r) => r.cardId),
        ]),
      ];

      if (allCardIds.length === 0) return [];

      return db
        .select({
          id:             cardCatalog.id,
          game:           cardCatalog.game,
          externalId:     cardCatalog.externalId,
          externalSource: cardCatalog.externalSource,
          name:           cardCatalog.name,
        })
        .from(cardCatalog)
        .where(
          and(
            inArray(cardCatalog.id, allCardIds),
            or(
              isNull(cardCatalog.priceUpdatedAt),
              lt(cardCatalog.priceUpdatedAt, staleThreshold)
            )
          )
        )
        .limit(MAX_CARDS_PER_RUN);
    });

    if (staleCards.length === 0) {
      return { refreshed: 0, skipped: 0, rateLimited: false };
    }

    // ── Step 2: fetch + update each card ─────────────────────────────────────

    let refreshed   = 0;
    let skipped     = 0;
    let rateLimited = false;

    for (const card of staleCards) {
      if (card.externalSource !== "tcgapi") { skipped++; continue; }

      const rl = tcgApiRatelimit
        ? await tcgApiRatelimit.limit("refresh-job")
        : { success: true };

      if (!rl.success) {
        rateLimited = true;
        break;
      }

      const outcome = await step.run(`refresh-${card.id}`, async () => {
        try {
          const fresh = await fetchCardByExternalId(card.externalId, card.game as GameKey);
          if (!fresh || fresh.market_price == null) return "skipped" as const;

          const priceStr = String(fresh.market_price);

          await Promise.all([
            db
              .update(cardCatalog)
              .set({
                marketPrice:    priceStr,
                priceUpdatedAt: new Date(),
                updatedAt:      new Date(),
                ...(fresh.image_url ? { imageUrl: fresh.image_url } : {}),
              })
              .where(
                // eq import not needed — direct where using Drizzle's column reference
                and(inArray(cardCatalog.id, [card.id]))
              ),
            db.insert(priceHistory).values({
              cardId: card.id,
              price:  priceStr,
              source: "tcgapi",
            }),
          ]);

          return "refreshed" as const;
        } catch {
          return "skipped" as const;
        }
      });

      if (outcome === "refreshed") refreshed++;
      else skipped++;
    }

    return { refreshed, skipped, rateLimited };
  }
);
