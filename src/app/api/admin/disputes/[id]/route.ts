import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/db/schema/transactions";
import { user as userTable } from "@/db/schema/auth";
import { createNotification } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

const resolveSchema = z.object({
  action: z.enum(["seller_fault", "buyer_fault", "no_fault"]),
  note:   z.string().max(500).optional(),
});

// POST /api/admin/disputes/[id]/resolve
export async function POST(request: NextRequest, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body   = await request.json().catch(() => null);
  const parsed = resolveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { action, note } = parsed.data;
  const now = new Date();

  const [txn] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id));

  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (txn.status !== "no_show" && txn.status !== "disputed") {
    return NextResponse.json({ error: "Transaction is not in a disputed state" }, { status: 409 });
  }

  // Determine fault party
  const faultUserId =
    action === "seller_fault" ? txn.sellerId :
    action === "buyer_fault"  ? txn.buyerId  : null;

  // Increment noShowCount on the at-fault user
  if (faultUserId) {
    const [faultUser] = await db
      .select({ n: userTable.noShowCount })
      .from(userTable)
      .where(eq(userTable.id, faultUserId));
    await db
      .update(userTable)
      .set({ noShowCount: (faultUser?.n ?? 0) + 1 })
      .where(eq(userTable.id, faultUserId));
  }

  // Mark transaction resolved
  await db
    .update(transactions)
    .set({
      status:     "completed",
      resolvedBy: session.user.id,
      resolvedAt: now,
      adminNote:  note ?? null,
      updatedAt:  now,
    })
    .where(eq(transactions.id, id));

  // Notify both parties
  const actionLabel =
    action === "seller_fault" ? "resolved — seller was at fault" :
    action === "buyer_fault"  ? "resolved — buyer was at fault"  :
    "resolved — no fault assigned";

  createNotification(txn.buyerId,  "system", "Transaction dispute resolved",
    `Your dispute has been ${actionLabel}.`, `/transactions/${id}`).catch(console.error);
  createNotification(txn.sellerId, "system", "Transaction dispute resolved",
    `Your dispute has been ${actionLabel}.`, `/transactions/${id}`).catch(console.error);

  return NextResponse.json({ ok: true });
}
