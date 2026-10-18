import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions, meetupProposals } from "@/db/schema/transactions";

type Params = { params: Promise<{ id: string; meetupId: string }> };

const respondSchema = z.object({
  status: z.enum(["accepted", "declined"]),
});

// PATCH /api/transactions/[id]/meetup/[meetupId] — accept or decline a meetup proposal
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, meetupId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await request.json().catch(() => null);
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const uid = session.user.id;

  const [txn] = await db.select().from(transactions).where(eq(transactions.id, id));
  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (txn.buyerId !== uid && txn.sellerId !== uid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [proposal] = await db
    .select()
    .from(meetupProposals)
    .where(eq(meetupProposals.id, meetupId));

  if (!proposal || proposal.transactionId !== id) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // Only the OTHER party (not the proposer) can respond
  if (proposal.proposerId === uid) {
    return NextResponse.json({ error: "Cannot respond to your own proposal" }, { status: 400 });
  }

  if (proposal.status !== "pending") {
    return NextResponse.json({ error: "Proposal already responded to" }, { status: 409 });
  }

  await db
    .update(meetupProposals)
    .set({ status: parsed.data.status })
    .where(eq(meetupProposals.id, meetupId));

  return NextResponse.json({ ok: true, status: parsed.data.status });
}
