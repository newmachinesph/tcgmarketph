import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user as userTable } from "@/db/schema/auth";
import { offers } from "@/db/schema/offers";
import { transactions } from "@/db/schema/transactions";
import {
  emailOfferAccepted,
  emailOfferDeclined,
  emailOfferCountered,
  emailCounterDeclined,
} from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("decline") }),
  z.object({
    action:         z.literal("counter"),
    counterPrice:   z.coerce.number().positive("Counter price must be greater than 0"),
    counterMessage: z.string().max(500).optional(),
  }),
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("accept_counter") }),
  z.object({ action: z.literal("decline_counter") }),
]);

// PATCH /api/offers/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const uid = session.user.id;

  // Load offer + listing + card
  const [row] = await db
    .select({ offer: offers, listing: listings, card: cardCatalog })
    .from(offers)
    .innerJoin(listings, eq(offers.listingId, listings.id))
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .where(eq(offers.id, id));

  if (!row) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

  const offer    = row.offer;
  const isBuyer  = uid === offer.buyerId;
  const isSeller = uid === offer.sellerId;
  if (!isBuyer && !isSeller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action } = parsed.data;

  // ── Permission matrix ────────────────────────────────────────────────────
  if ((action === "accept" || action === "decline" || action === "counter") && !isSeller) {
    return NextResponse.json({ error: "Only the seller can accept, decline, or counter" }, { status: 403 });
  }
  if ((action === "cancel" || action === "accept_counter" || action === "decline_counter") && !isBuyer) {
    return NextResponse.json({ error: "Only the buyer can cancel or respond to a counter" }, { status: 403 });
  }

  // ── State guards ─────────────────────────────────────────────────────────
  if ((action === "accept" || action === "decline" || action === "counter") && offer.status !== "pending") {
    return NextResponse.json({ error: "Offer is not pending" }, { status: 409 });
  }
  if ((action === "accept_counter" || action === "decline_counter") && offer.status !== "countered") {
    return NextResponse.json({ error: "No counter to respond to" }, { status: 409 });
  }
  if (action === "cancel" && !["pending", "countered"].includes(offer.status)) {
    return NextResponse.json({ error: "Cannot cancel in this state" }, { status: 409 });
  }

  // ── Fetch counterparty for emails ────────────────────────────────────────
  const otherId = isBuyer ? offer.sellerId : offer.buyerId;
  const [other] = await db
    .select({ email: userTable.email, name: userTable.name, displayName: userTable.displayName })
    .from(userTable)
    .where(eq(userTable.id, otherId));

  const myName    = session.user.displayName ?? session.user.name;
  const otherName = other?.displayName ?? other?.name ?? "—";

  // ── Apply action ─────────────────────────────────────────────────────────

  if (action === "accept" || action === "accept_counter") {
    // Create a transaction at the accepted price
    const agreedPrice = action === "accept_counter" && offer.counterPrice
      ? offer.counterPrice
      : offer.offeredPrice;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const [txn] = await db
      .insert(transactions)
      .values({
        listingId:   offer.listingId,
        buyerId:     offer.buyerId,
        sellerId:    offer.sellerId,
        agreedPrice,
        quantity:    1,
        status:      "agreed", // skip pending — offer negotiation IS the confirmation
      })
      .returning();

    // Mark listing sold (quantity 1 assumed for offer flow)
    await db
      .update(listings)
      .set({ quantity: row.listing.quantity - 1, status: row.listing.quantity <= 1 ? "sold" : "active" })
      .where(eq(listings.id, offer.listingId));

    await db
      .update(offers)
      .set({ status: "accepted", transactionId: txn.id })
      .where(eq(offers.id, id));

    if (other) {
      emailOfferAccepted({
        recipientEmail: other.email,
        recipientName:  otherName,
        cardName:       row.card.name,
        agreedPrice,
        txnId:          txn.id,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true, status: "accepted", transactionId: txn.id });
  }

  if (action === "decline") {
    await db.update(offers).set({ status: "declined" }).where(eq(offers.id, id));
    if (other) {
      emailOfferDeclined({
        buyerEmail: other.email,
        buyerName:  otherName,
        cardName:   row.card.name,
        offerId:    id,
      }).catch(console.error);
    }
    return NextResponse.json({ ok: true, status: "declined" });
  }

  if (action === "counter") {
    const { counterPrice, counterMessage } = parsed.data as Extract<typeof parsed.data, { action: "counter" }>;
    await db
      .update(offers)
      .set({ status: "countered", counterPrice: String(counterPrice), counterMessage })
      .where(eq(offers.id, id));
    if (other) {
      emailOfferCountered({
        buyerEmail:     other.email,
        buyerName:      otherName,
        sellerName:     myName,
        cardName:       row.card.name,
        counterPrice:   String(counterPrice),
        counterMessage,
        offerId:        id,
      }).catch(console.error);
    }
    return NextResponse.json({ ok: true, status: "countered" });
  }

  if (action === "decline_counter") {
    await db.update(offers).set({ status: "declined" }).where(eq(offers.id, id));
    if (other) {
      emailCounterDeclined({
        sellerEmail: other.email,
        sellerName:  otherName,
        cardName:    row.card.name,
        offerId:     id,
      }).catch(console.error);
    }
    return NextResponse.json({ ok: true, status: "declined" });
  }

  // cancel
  await db.update(offers).set({ status: "cancelled" }).where(eq(offers.id, id));
  return NextResponse.json({ ok: true, status: "cancelled" });
}
