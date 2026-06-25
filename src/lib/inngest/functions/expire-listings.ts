import { lte, and, inArray } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { listings } from "@/db/schema/listings";

/**
 * expire-listings — daily job (02:00 UTC).
 *
 * Marks all active/paused listings whose expires_at has passed as "expired".
 * Keeps the catalog clean so buyers only see fresh listings.
 */
export const expireListings = inngest.createFunction(
  {
    id:       "expire-listings",
    name:     "Expire Stale Listings",
    retries:  3,
    triggers: [{ cron: "0 2 * * *" }],
  },
  async ({ step }) => {
    const expired = await step.run("mark-expired", async () => {
      const now = new Date();

      const toExpire = await db
        .select({ id: listings.id })
        .from(listings)
        .where(
          and(
            inArray(listings.status, ["active", "paused"]),
            lte(listings.expiresAt, now)
          )
        );

      if (toExpire.length === 0) return 0;

      await db
        .update(listings)
        .set({ status: "expired", updatedAt: now })
        .where(inArray(listings.id, toExpire.map((r) => r.id)));

      return toExpire.length;
    });

    return { expired };
  }
);
