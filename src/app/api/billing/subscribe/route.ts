import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { createPaymentLink } from "@/lib/paymongo";

export const POWER_SELLER_PRICE_PHP = 199;

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const link = await createPaymentLink({
      amountPHP:   POWER_SELLER_PRICE_PHP,
      description: "TCGMarket PH — Power Seller (30 days)",
      remarks:     `sub:${session.user.id}`,
    });
    return NextResponse.json({ checkoutUrl: link.checkoutUrl });
  } catch (err) {
    console.error("[billing/subscribe]", err);
    return NextResponse.json({ error: "Failed to create payment link" }, { status: 500 });
  }
}
