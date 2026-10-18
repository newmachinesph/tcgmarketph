import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/db/schema/auth";
import { transactions, meetupProposals } from "@/db/schema/transactions";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { emailMeetupProposed } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

const proposeSchema = z.object({
  location:   z.string().min(3, "Location required").max(300),
  proposedAt: z.string().datetime({ offset: true }),
});

// POST /api/transactions/[id]/meetup — propose a meetup
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = proposeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const uid = session.user.id;

  const [row] = await db
    .select({ transaction: transactions, card: cardCatalog })
    .from(transactions)
    .innerJoin(listings, eq(transactions.listingId, listings.id))
    .innerJoin(cardCatalog, eq(listings.cardId, cardCatalog.id))
    .where(eq(transactions.id, id));

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.transaction.buyerId !== uid && row.transaction.sellerId !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (row.transaction.status !== "agreed") {
    return NextResponse.json({ error: "Meetup can only be proposed after seller confirms" }, { status: 409 });
  }

  const [proposal] = await db
    .insert(meetupProposals)
    .values({
      transactionId: id,
      proposerId:    uid,
      location:      parsed.data.location,
      proposedAt:    new Date(parsed.data.proposedAt),
    })
    .returning();

  // Notify the other party
  const otherId = uid === row.transaction.buyerId ? row.transaction.sellerId : row.transaction.buyerId;
  const [other] = await db
    .select({ email: userTable.email, name: userTable.name, displayName: userTable.displayName })
    .from(userTable)
    .where(eq(userTable.id, otherId));

  if (other) {
    emailMeetupProposed({
      recipientEmail: other.email,
      recipientName:  other.displayName ?? other.name,
      proposerName:   session.user.displayName ?? session.user.name,
      cardName:       row.card.name,
      location:       parsed.data.location,
      proposedAt:     new Date(parsed.data.proposedAt),
      txnId:          id,
      recipientId:    otherId,
    }).catch(console.error);
  }

  return NextResponse.json({ proposal }, { status: 201 });
}
