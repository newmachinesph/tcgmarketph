import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { refreshCardPrices } from "@/lib/inngest/functions/refresh-prices";
import { expireListings } from "@/lib/inngest/functions/expire-listings";
import { expireOffers } from "@/lib/inngest/functions/expire-offers";
import { closeAuctions } from "@/lib/inngest/functions/close-auctions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [refreshCardPrices, expireListings, expireOffers, closeAuctions],
});
