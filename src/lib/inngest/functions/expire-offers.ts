import { lte, eq, and, inArray } from "drizzle-orm";
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { offers } from "@/db/schema/offers";

/**
 * expire-offers — hourly job.
 *
 * Marks pending/countered offers whose expires_at has passed as "expired".
 */
export const expireOffers = inngest.createFunction(
  {
    id:       "expire-offers",
    name:     "Expire Stale Offers",
    retries:  3,
    triggers: [{ cron: "0 * * * *" }], // every hour
  },
  async ({ step }) => {
    const expired = await step.run("mark-expired", async () => {
      const now = new Date();

      const toExpire = await db
        .select({ id: offers.id })
        .from(offers)
        .where(
          and(
            inArray(offers.status, ["pending", "countered"]),
            lte(offers.expiresAt, now)
          )
        );

      if (toExpire.length === 0) return 0;

      await db
        .update(offers)
        .set({ status: "expired", updatedAt: now })
        .where(inArray(offers.id, toExpire.map((r) => r.id)));

      return toExpire.length;
    });

    return { expired };
  }
);
