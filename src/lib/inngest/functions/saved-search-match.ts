import { eq, ne, isNull, or, lte } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { savedSearches } from "@/db/schema/searches";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user as userTable } from "@/db/schema/auth";
import { createNotification } from "@/lib/notify";
import { DEFAULT_PREFS } from "@/lib/email-prefs";

const NOTIFY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function matchesSearch(
  query:   { q?: string; game?: string; condition?: string; minPrice?: string; maxPrice?: string },
  card:    { name: string; setName: string | null; game: string },
  listing: { condition: string; price: string },
): boolean {
  if (query.game && query.game !== card.game) return false;
  if (query.condition && query.condition !== listing.condition) return false;
  if (query.minPrice && parseFloat(listing.price) < parseFloat(query.minPrice)) return false;
  if (query.maxPrice && parseFloat(listing.price) > parseFloat(query.maxPrice)) return false;
  if (query.q) {
    const needle   = query.q.toLowerCase();
    const haystack = `${card.name} ${card.setName ?? ""}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

export const savedSearchMatch = inngest.createFunction(
  {
    id:       "saved-search-match",
    name:     "Saved Search Match Alerts",
    retries:  2,
    triggers: [{ event: "listings/saved-search.match" }],
  },
  async ({ event, step }: { event: { data: { listingId: string } }; step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> } }) => {
    const { listingId } = event.data;

    const result = await step.run("match-searches", async () => {
      // Load the new listing + card
      const [row] = await db
        .select({
          listing: { id: listings.id, sellerId: listings.sellerId, condition: listings.condition, price: listings.price },
          card:    { name: cardCatalog.name, setName: cardCatalog.setName, game: cardCatalog.game },
        })
        .from(listings)
        .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
        .where(eq(listings.id, listingId));

      if (!row) return { notified: 0 };

      const cooldownCutoff = new Date(Date.now() - NOTIFY_COOLDOWN_MS);

      // Load all saved searches not on cooldown (excluding the seller)
      const searches = await db
        .select({
          search: savedSearches,
          email:       userTable.email,
          name:        userTable.name,
          displayName: userTable.displayName,
          emailPrefs:  userTable.emailPrefs,
        })
        .from(savedSearches)
        .innerJoin(userTable, eq(savedSearches.userId, userTable.id))
        .where(
          or(
            isNull(savedSearches.lastNotifiedAt),
            lte(savedSearches.lastNotifiedAt, cooldownCutoff),
          )
        );

      const matchedIds: string[] = [];
      let notified = 0;

      for (const { search, email, name, displayName, emailPrefs } of searches) {
        // Skip the seller's own saved searches
        if (search.userId === row.listing.sellerId) continue;

        if (!matchesSearch(search.query, row.card, row.listing)) continue;

        matchedIds.push(search.id);

        const displayedName = displayName ?? name;
        createNotification(
          search.userId,
          "wishlist_match",
          `New listing matches "${search.name}"`,
          `${row.card.name} is available for ₱${parseFloat(row.listing.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
          `/listings/${listingId}`,
        ).catch(console.error);

        // Email if wishlist pref enabled (saved searches use "wishlist" category)
        const prefs = { ...DEFAULT_PREFS, ...(emailPrefs ?? {}) };
        if (prefs.wishlist) {
          const { emailSavedSearchMatch } = await import("@/lib/email");
          emailSavedSearchMatch({
            userEmail:  email,
            userName:   displayedName,
            searchName: search.name,
            cardName:   row.card.name,
            price:      row.listing.price,
            listingId,
            userId:     search.userId,
          }).catch(console.error);
        }

        notified++;
      }

      // Bulk-update lastNotifiedAt for matched searches
      if (matchedIds.length > 0) {
        const now = new Date();
        await Promise.all(
          matchedIds.map((id) =>
            db
              .update(savedSearches)
              .set({ lastNotifiedAt: now })
              .where(eq(savedSearches.id, id))
          )
        );
      }

      return { notified };
    });

    return result;
  }
);
