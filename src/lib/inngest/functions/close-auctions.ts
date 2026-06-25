import { lte, eq, and, desc } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { listings, bids } from "@/db/schema/listings";
import { user as userTable } from "@/db/schema/auth";
import { transactions } from "@/db/schema/transactions";
import { emailTransactionAgreed } from "@/lib/email";

/**
 * close-auctions — runs every minute.
 *
 * For every active auction whose auction_end has passed:
 * 1. Mark listing as "sold" (has bids) or "expired" (no bids)
 * 2. Pick the highest bid as the winner
 * 3. Create an "agreed" transaction between winner and seller
 * 4. Notify both parties by email
 */
export const closeAuctions = inngest.createFunction(
  {
    id:       "close-auctions",
    name:     "Close Ended Auctions",
    retries:  3,
    triggers: [{ cron: "* * * * *" }], // every minute
  },
  async ({ step }) => {
    const closed = await step.run("close-ended-auctions", async () => {
      const now = new Date();

      // Find all active auctions that have ended
      const ended = await db
        .select({ id: listings.id, sellerId: listings.sellerId, currentBid: listings.currentBid, price: listings.price })
        .from(listings)
        .where(
          and(
            eq(listings.type, "auction"),
            eq(listings.status, "active"),
            lte(listings.auctionEnd, now)
          )
        );

      let sold = 0;
      let noSale = 0;

      for (const listing of ended) {
        // Find the winning bid (highest amount)
        const [topBid] = await db
          .select({ bid: bids, bidder: userTable })
          .from(bids)
          .innerJoin(userTable, eq(bids.bidderId, userTable.id))
          .where(eq(bids.listingId, listing.id))
          .orderBy(desc(bids.amount))
          .limit(1);

        if (!topBid) {
          // No bids — mark expired
          await db
            .update(listings)
            .set({ status: "expired", updatedAt: now })
            .where(eq(listings.id, listing.id));
          noSale++;
          continue;
        }

        // Mark listing sold
        await db
          .update(listings)
          .set({ status: "sold", updatedAt: now })
          .where(eq(listings.id, listing.id));

        // Create agreed transaction for the winner
        const [txn] = await db
          .insert(transactions)
          .values({
            listingId:   listing.id,
            buyerId:     topBid.bid.bidderId,
            sellerId:    listing.sellerId,
            agreedPrice: topBid.bid.amount,
            quantity:    1,
            status:      "agreed",
          })
          .returning();

        // Fetch seller info for email
        const [seller] = await db
          .select({ email: userTable.email, name: userTable.name, displayName: userTable.displayName })
          .from(userTable)
          .where(eq(userTable.id, listing.sellerId));

        // Notify winner
        await emailTransactionAgreed({
          buyerEmail:  topBid.bidder.email,
          buyerName:   topBid.bidder.displayName ?? topBid.bidder.name,
          sellerName:  seller?.displayName ?? seller?.name ?? "Seller",
          cardName:    "your auction win", // card name omitted for simplicity in cron context
          price:       topBid.bid.amount,
          txnId:       txn.id,
        });

        sold++;
      }

      return { sold, noSale };
    });

    return closed;
  }
);
