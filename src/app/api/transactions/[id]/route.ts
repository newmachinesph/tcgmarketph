import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, or, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user as userTable } from "@/db/schema/auth";
import { transactions, meetupProposals } from "@/db/schema/transactions";
import {
  emailTransactionAgreed,
  emailTransactionCancelled,
} from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action:       z.enum(["confirm", "cancel", "complete", "no_show"]),
  cancelReason: z.string().max(500).optional(),
});

// GET /api/transactions/[id] — full detail
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await db
    .select({
      transaction: transactions,
      listing: listings,
      card: {
        name:     cardCatalog.name,
        setName:  cardCatalog.setName,
        game:     cardCatalog.game,
        imageUrl: cardCatalog.imageUrl,
      },
    })
    .from(transactions)
    .innerJoin(listings, eq(transactions.listingId, listings.id))
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .where(eq(transactions.id, id));

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const uid = session.user.id;
  if (row.transaction.buyerId !== uid && row.transaction.sellerId !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch buyer, seller, and meetup proposals in parallel
  const [buyers, sellers, proposals] = await Promise.all([
    db.select({ id: userTable.id, name: userTable.name, displayName: userTable.displayName, image: userTable.image, city: userTable.city, phoneVerified: userTable.phoneVerified, reputationScore: userTable.reputationScore })
      .from(userTable).where(eq(userTable.id, row.transaction.buyerId)),
    db.select({ id: userTable.id, name: userTable.name, displayName: userTable.displayName, image: userTable.image, city: userTable.city, phoneVerified: userTable.phoneVerified, reputationScore: userTable.reputationScore })
      .from(userTable).where(eq(userTable.id, row.transaction.sellerId)),
    db.select().from(meetupProposals)
      .where(eq(meetupProposals.transactionId, id))
      .orderBy(desc(meetupProposals.createdAt)),
  ]);

  return NextResponse.json({
    transaction: {
      ...row.transaction,
      card:      row.card,
      buyer:     buyers[0],
      seller:    sellers[0],
      meetups:   proposals,
      role:      uid === row.transaction.buyerId ? "buyer" : "seller",
    },
  });
}

// PATCH /api/transactions/[id] — status action
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { action, cancelReason } = parsed.data;
  const uid = session.user.id;

  const [row] = await db
    .select({ transaction: transactions, listing: listings, card: cardCatalog, buyerRow: userTable })
    .from(transactions)
    .innerJoin(listings, eq(transactions.listingId, listings.id))
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .innerJoin(userTable, eq(transactions.buyerId, userTable.id))
    .where(eq(transactions.id, id));

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const txn = row.transaction;
  const isBuyer  = uid === txn.buyerId;
  const isSeller = uid === txn.sellerId;
  if (!isBuyer && !isSeller) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // ── Validate action permissions ──────────────────────────────────────────
  if (action === "confirm") {
    if (!isSeller) return NextResponse.json({ error: "Only seller can confirm" }, { status: 403 });
    if (txn.status !== "pending") return NextResponse.json({ error: "Nothing to confirm" }, { status: 409 });
  }
  if (action === "cancel") {
    if (!["pending", "agreed"].includes(txn.status)) {
      return NextResponse.json({ error: "Cannot cancel in this state" }, { status: 409 });
    }
  }
  if (action === "complete" || action === "no_show") {
    if (txn.status !== "agreed") {
      return NextResponse.json({ error: "Transaction not yet agreed" }, { status: 409 });
    }
  }

  // ── Apply state machine ─────────────────────────────────────────────────
  const nextStatus = {
    confirm:  "agreed",
    cancel:   "cancelled",
    complete: "completed",
    no_show:  "no_show",
  }[action] as typeof txn.status;

  await db
    .update(transactions)
    .set({ status: nextStatus, cancelReason: cancelReason ?? null })
    .where(eq(transactions.id, id));

  // When seller confirms: decrement listing quantity, mark sold if 0
  if (action === "confirm") {
    const newQty = row.listing.quantity - txn.quantity;
    await db
      .update(listings)
      .set({
        quantity: newQty,
        status:   newQty <= 0 ? "sold" : "active",
      })
      .where(eq(listings.id, txn.listingId));

    // Fetch seller name for email
    const [sellerUser] = await db
      .select({ name: userTable.name, displayName: userTable.displayName })
      .from(userTable)
      .where(eq(userTable.id, txn.sellerId));

    emailTransactionAgreed({
      buyerEmail: row.buyerRow.email,
      buyerName:  row.buyerRow.displayName ?? row.buyerRow.name,
      sellerName: sellerUser?.displayName ?? sellerUser?.name ?? "Your seller",
      cardName:   row.card.name,
      price:      txn.agreedPrice,
      txnId:      id,
    }).catch(console.error);
  }

  // When completed: increment reputationScore for both buyer and seller
  if (action === "complete") {
    await db
      .update(userTable)
      .set({ reputationScore: sql`${userTable.reputationScore} + 1` })
      .where(or(eq(userTable.id, txn.buyerId), eq(userTable.id, txn.sellerId)));
  }

  // When no_show: increment noShowCount for the OTHER party (the one who didn't appear)
  if (action === "no_show") {
    const absentId = isBuyer ? txn.sellerId : txn.buyerId;
    await db
      .update(userTable)
      .set({ noShowCount: sql`${userTable.noShowCount} + 1` })
      .where(eq(userTable.id, absentId));
  }

  // When cancelled: if it was "agreed", restore listing quantity
  if (action === "cancel" && txn.status === "agreed") {
    await db
      .update(listings)
      .set({
        quantity: row.listing.quantity + txn.quantity,
        status:   "active",
      })
      .where(eq(listings.id, txn.listingId));

    // Notify the other party
    const otherId = isBuyer ? txn.sellerId : txn.buyerId;
    const [other] = await db
      .select({ email: userTable.email, name: userTable.name, displayName: userTable.displayName })
      .from(userTable)
      .where(eq(userTable.id, otherId));

    const cancellerName = session.user.displayName ?? session.user.name;
    if (other) {
      emailTransactionCancelled({
        recipientEmail: other.email,
        recipientName:  other.displayName ?? other.name,
        cardName:       row.card.name,
        cancelledBy:    cancellerName,
        reason:         cancelReason,
        txnId:          id,
      }).catch(console.error);
    }
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
