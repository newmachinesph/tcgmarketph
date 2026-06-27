import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { transactions } from "@/db/schema/transactions";
import { createNotification } from "@/lib/notify";
import { emailTransactionAgreed } from "@/lib/email";
import { verifyPayMongoSignature } from "@/lib/paymongo";

const SUBSCRIPTION_DAYS = 30;

export async function POST(request: NextRequest) {
  const rawBody   = await request.text();
  const sigHeader = request.headers.get("paymongo-signature") ?? "";
  const secret    = process.env.PAYMONGO_WEBHOOK_SECRET ?? "";

  if (!secret) {
    console.error("[webhook/paymongo] PAYMONGO_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  if (!verifyPayMongoSignature(rawBody, sigHeader, secret)) {
    console.warn("[webhook/paymongo] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventData   = payload["data"]             as Record<string, unknown> | undefined;
  const attrs       = eventData?.["attributes"]   as Record<string, unknown> | undefined;
  const eventType   = attrs?.["type"]             as string | undefined;
  const paymentData = attrs?.["data"]             as Record<string, unknown> | undefined;
  const paymentAttrs = paymentData?.["attributes"] as Record<string, unknown> | undefined;

  let linkId:           string | undefined;
  let txnIdFromRemarks: string | undefined;
  let subUserIdFromRemarks: string | undefined;

  if (eventType === "link.payment.paid") {
    linkId = paymentData?.["id"] as string | undefined;
    const linkAttrs = paymentData?.["attributes"] as Record<string, unknown> | undefined;
    const remarks = linkAttrs?.["remarks"] as string | undefined ?? "";
    const subM = remarks.match(/^sub:(.+)$/i);
    if (subM) subUserIdFromRemarks = subM[1];
  } else if (eventType === "payment.paid") {
    const source = paymentAttrs?.["source"] as Record<string, unknown> | undefined;
    linkId = source?.["id"] as string | undefined;
    const remarks = paymentAttrs?.["remarks"] as string | undefined ?? "";
    const txnM = remarks.match(/txn:([a-z0-9]+)/i);
    txnIdFromRemarks = txnM?.[1];
    const subM = remarks.match(/^sub:(.+)$/i);
    if (subM) subUserIdFromRemarks = subM[1];
  } else {
    return NextResponse.json({ ok: true });
  }

  // ── Subscription upgrade ─────────────────────────────────────────────────────
  if (subUserIdFromRemarks) {
    const expiresAt = new Date(Date.now() + SUBSCRIPTION_DAYS * 86_400_000);
    await db
      .update(userTable)
      .set({ subscriptionTier: "power_seller", subscriptionExpiresAt: expiresAt })
      .where(eq(userTable.id, subUserIdFromRemarks));

    createNotification(
      subUserIdFromRemarks,
      "transaction_completed",
      "Power Seller activated",
      `Your Power Seller subscription is active until ${expiresAt.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}.`,
      "/settings",
    ).catch(console.error);

    console.log(`[webhook/paymongo] Power Seller activated for user ${subUserIdFromRemarks} until ${expiresAt.toISOString()}`);
    return NextResponse.json({ ok: true });
  }

  // ── Look up the unpaid transaction ──────────────────────────────────────────
  let txnRecord: typeof transactions.$inferSelect | undefined;

  if (linkId) {
    const [found] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.paymongoLinkId, linkId), isNull(transactions.paidAt)))
      .limit(1);
    txnRecord = found;
  }

  if (!txnRecord && txnIdFromRemarks) {
    const [found] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, txnIdFromRemarks), isNull(transactions.paidAt)))
      .limit(1);
    txnRecord = found;
  }

  if (!txnRecord) {
    console.warn("[webhook/paymongo] No unpaid transaction for link:", linkId, "event:", eventType);
    return NextResponse.json({ ok: true }); // acknowledge to stop retries
  }

  if (txnRecord.status !== "pending") {
    console.log("[webhook/paymongo] Already processed:", txnRecord.id);
    return NextResponse.json({ ok: true });
  }

  // ── Mark agreed + record payment timestamp ──────────────────────────────────
  await db
    .update(transactions)
    .set({ status: "agreed", paidAt: new Date() })
    .where(eq(transactions.id, txnRecord.id));

  // Decrement listing quantity / mark sold; fetch card name for email
  const [listing] = await db
    .select({ id: listings.id, quantity: listings.quantity, cardId: listings.cardId })
    .from(listings)
    .where(eq(listings.id, txnRecord.listingId));

  if (listing) {
    const newQty = listing.quantity - txnRecord.quantity;
    await db
      .update(listings)
      .set({ quantity: newQty, status: newQty <= 0 ? "sold" : "active" })
      .where(eq(listings.id, listing.id));
  }

  // ── Notifications ────────────────────────────────────────────────────────────
  const [buyer, seller, cardRow] = await Promise.all([
    db.select({ email: userTable.email, name: userTable.name, displayName: userTable.displayName })
      .from(userTable).where(eq(userTable.id, txnRecord.buyerId)).then((r) => r[0]),
    db.select({ email: userTable.email, name: userTable.name, displayName: userTable.displayName })
      .from(userTable).where(eq(userTable.id, txnRecord.sellerId)).then((r) => r[0]),
    listing?.cardId
      ? db.select({ name: cardCatalog.name }).from(cardCatalog).where(eq(cardCatalog.id, listing.cardId)).then((r) => r[0])
      : Promise.resolve(undefined),
  ]);

  createNotification(
    txnRecord.buyerId,
    "transaction_agreed",
    "Payment confirmed",
    "Your online payment was received. Arrange a meetup with the seller.",
    `/transactions/${txnRecord.id}`,
  ).catch(console.error);

  createNotification(
    txnRecord.sellerId,
    "transaction_agreed",
    "Buyer paid online",
    "A buyer has paid online for your listing. Arrange a meetup to hand over the card.",
    `/transactions/${txnRecord.id}`,
  ).catch(console.error);

  if (buyer && seller) {
    emailTransactionAgreed({
      buyerEmail:  buyer.email,
      buyerName:   buyer.displayName ?? buyer.name,
      sellerName:  seller.displayName ?? seller.name,
      cardName:    cardRow?.name ?? "your listing",
      price:       txnRecord.agreedPrice,
      txnId:       txnRecord.id,
      buyerId:     txnRecord.buyerId,
    }).catch(console.error);
  }

  console.log(`[webhook/paymongo] Payment confirmed for txn ${txnRecord.id}`);
  return NextResponse.json({ ok: true });
}
