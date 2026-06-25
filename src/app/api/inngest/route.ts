import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { refreshCardPrices } from "@/lib/inngest/functions/refresh-prices";
import { expireListings } from "@/lib/inngest/functions/expire-listings";
import { expireOffers } from "@/lib/inngest/functions/expire-offers";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [refreshCardPrices, expireListings, expireOffers],
});
