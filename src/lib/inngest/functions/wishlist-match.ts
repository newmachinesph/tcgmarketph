import { eq, and, or, inArray } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { userWishlist, cardCatalog } from "@/db/schema/cards";
import { user as userTable } from "@/db/schema/auth";
import { blockedUsers } from "@/db/schema/blocks";
import { createNotification } from "@/lib/notify";
import { emailWishlistMatch } from "@/lib/email";

export const wishlistMatch = inngest.createFunction(
  {
    id:       "wishlist-match",
    name:     "Wishlist Match Alerts",
    retries:  2,
    triggers: [{ event: "listings/wishlist.match" }],
  },
  async ({ event, step }: { event: { data: { listingId: string; cardId: string; sellerId: string; price: string } }; step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> } }) => {
    const { listingId, cardId, sellerId, price } = event.data;

    const result = await step.run("notify-wishers", async () => {
      // 1. Find all wishers for this card
      const wishers = await db
        .select({
          userId:      userWishlist.userId,
          email:       userTable.email,
          name:        userTable.name,
          displayName: userTable.displayName,
        })
        .from(userWishlist)
        .innerJoin(userTable, eq(userWishlist.userId, userTable.id))
        .where(eq(userWishlist.cardId, cardId));

      // Filter out the seller
      const eligibleWishers = wishers.filter((w) => w.userId !== sellerId);
      if (eligibleWishers.length === 0) return { notified: 0 };

      const wisherIds = eligibleWishers.map((w) => w.userId);

      // 2. Load block pairs involving the seller ↔ any wisher
      const blockPairs = await db
        .select({ blockerId: blockedUsers.blockerId, blockedId: blockedUsers.blockedId })
        .from(blockedUsers)
        .where(
          or(
            and(eq(blockedUsers.blockerId, sellerId), inArray(blockedUsers.blockedId, wisherIds)),
            and(inArray(blockedUsers.blockerId, wisherIds), eq(blockedUsers.blockedId, sellerId))
          )
        );

      const blockedSet = new Set<string>();
      for (const pair of blockPairs) {
        blockedSet.add(pair.blockerId === sellerId ? pair.blockedId : pair.blockerId);
      }

      // 3. Load card name
      const [card] = await db
        .select({ name: cardCatalog.name })
        .from(cardCatalog)
        .where(eq(cardCatalog.id, cardId));
      const cardName = card?.name ?? "Unknown card";

      // 4. Notify each eligible non-blocked wisher
      let notified = 0;
      for (const wisher of eligibleWishers) {
        if (blockedSet.has(wisher.userId)) continue;

        const displayName = wisher.displayName ?? wisher.name;
        const link = `/listings/${listingId}`;

        createNotification(
          wisher.userId,
          "wishlist_match",
          `${cardName} is now listed`,
          `Available for ₱${parseFloat(price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
          link,
        ).catch(console.error);

        emailWishlistMatch({
          wisherEmail: wisher.email,
          wisherName:  displayName,
          cardName,
          price,
          listingId,
        }).catch(console.error);

        notified++;
      }

      return { notified };
    });

    return result;
  }
);
