import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { refreshCardPrices } from "@/lib/inngest/functions/refresh-prices";
import { expireListings } from "@/lib/inngest/functions/expire-listings";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [refreshCardPrices, expireListings],
});
