import { and, eq, gt, or, sql } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { wantedListings } from "@/db/schema/wanted";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { createNotification } from "@/lib/notify";

export const wantedMatch = inngest.createFunction(
  {
    id:       "wanted-match",
    name:     "Wanted Listing Match Alerts",
    retries:  2,
    triggers: [{ event: "listings/wanted.match" }],
  },
  async ({
    event,
    step,
  }: {
    event: { data: { listingId: string; cardId: string; sellerId: string } };
    step:  { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> };
  }) => {
    const { listingId, cardId, sellerId } = event.data;

    return await step.run("notify-wanted-posters", async () => {
      const [card] = await db
        .select({ name: cardCatalog.name, game: cardCatalog.game })
        .from(cardCatalog)
        .where(eq(cardCatalog.id, cardId));
      if (!card) return { notified: 0 };

      const now = new Date();

      // Find open wanted listings for the same game (or "any") where cardName roughly matches
      const wanted = await db
        .select()
        .from(wantedListings)
        .where(and(
          eq(wantedListings.status, "open"),
          gt(wantedListings.expiresAt, now),
          or(eq(wantedListings.game, card.game), eq(wantedListings.game, "any")),
          sql`lower(${wantedListings.cardName}) like '%' || lower(${card.name}) || '%'
              or lower(${card.name}) like '%' || lower(${wantedListings.cardName}) || '%'`,
        ));

      const eligible = wanted.filter((w) => w.userId !== sellerId);
      if (!eligible.length) return { notified: 0 };

      const [listing] = await db
        .select({ price: listings.price })
        .from(listings)
        .where(eq(listings.id, listingId));

      const priceStr = listing
        ? `₱${parseFloat(listing.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
        : "";

      let notified = 0;
      for (const w of eligible) {
        createNotification(
          w.userId,
          "wishlist_match",
          `${card.name} is now listed`,
          `Someone listed this card${priceStr ? ` for ${priceStr}` : ""} — check if it matches your request.`,
          `/listings/${listingId}`,
        ).catch(console.error);
        notified++;
      }

      return { notified };
    });
  }
);
