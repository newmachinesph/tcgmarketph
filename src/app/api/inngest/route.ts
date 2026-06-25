import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { refreshCardPrices } from "@/lib/inngest/functions/refresh-prices";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [refreshCardPrices],
});
