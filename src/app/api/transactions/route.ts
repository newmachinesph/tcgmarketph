import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, or, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user as userTable } from "@/db/schema/auth";
import { transactions, meetupProposals } from "@/db/schema/transactions";
import { emailTransactionCreated } from "@/lib/email";

const createSchema = z.object({
  listingId: z.string().min(1),
  quantity:  z.coerce.number().int().min(1).max(99).default(1),
  buyerNote: z.string().max(500).optional(),
});

// GET /api/transactions — my transactions (buyer + seller)
export async function GET(_request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const uid = session.user.id;

  const rows = await db
    .select({
      transaction: transactions,
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
    .where(or(eq(transactions.buyerId, uid), eq(transactions.sellerId, uid)))
    .orderBy(desc(transactions.updatedAt));

  // Fetch all involved users in one query
  const userIds = [...new Set(rows.flatMap((r) => [r.transaction.buyerId, r.transaction.sellerId]))];
  const users = userIds.length
    ? await db
        .select({ id: userTable.id, name: userTable.name, displayName: userTable.displayName, image: userTable.image })
        .from(userTable)
        .where(inArray(userTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json({
    transactions: rows.map((r) => ({
      ...r.transaction,
      card:   r.card,
      buyer:  userMap[r.transaction.buyerId],
      seller: userMap[r.transaction.sellerId],
      role:   r.transaction.buyerId === uid ? "buyer" : "seller",
    })),
  });
}

// POST /api/transactions — buyer commits to a listing
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { listingId, quantity, buyerNote } = parsed.data;

  // Fetch listing + seller email
  const [row] = await db
    .select({ listing: listings, card: cardCatalog, seller: userTable })
    .from(listings)
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .innerJoin(userTable, eq(listings.sellerId, userTable.id))
    .where(eq(listings.id, listingId));

  if (!row) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (row.listing.status !== "active") {
    return NextResponse.json({ error: "This listing is no longer available" }, { status: 409 });
  }
  if (row.listing.sellerId === session.user.id) {
    return NextResponse.json({ error: "You cannot buy your own listing" }, { status: 400 });
  }
  if (quantity > row.listing.quantity) {
    return NextResponse.json({ error: `Only ${row.listing.quantity} available` }, { status: 400 });
  }

  const [txn] = await db
    .insert(transactions)
    .values({
      listingId,
      buyerId:     session.user.id,
      sellerId:    row.listing.sellerId,
      agreedPrice: row.listing.price,
      quantity,
      buyerNote,
    })
    .returning();

  // Notify seller (fire-and-forget)
  emailTransactionCreated({
    sellerEmail: row.seller.email,
    sellerName:  row.seller.displayName ?? row.seller.name,
    buyerName:   session.user.displayName ?? session.user.name,
    cardName:    row.card.name,
    price:       row.listing.price,
    txnId:       txn.id,
  }).catch(console.error);

  return NextResponse.json({ transaction: txn }, { status: 201 });
}
