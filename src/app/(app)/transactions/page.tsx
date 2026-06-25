import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, or, desc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactions } from "@/db/schema/transactions";
import { listings } from "@/db/schema/listings";
import { cardCatalog } from "@/db/schema/cards";
import { user as userTable } from "@/db/schema/auth";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  pending:   { label: "Pending",   color: "text-yellow-400",  Icon: ClockIcon },
  agreed:    { label: "Agreed",    color: "text-blue-400",    Icon: CheckCircleIcon },
  completed: { label: "Completed", color: "text-emerald-400", Icon: CheckCircleIcon },
  cancelled: { label: "Cancelled", color: "text-[#9A9A9A]",   Icon: XCircleIcon },
  no_show:   { label: "No-show",   color: "text-orange-400",  Icon: ExclamationCircleIcon },
  disputed:  { label: "Disputed",  color: "text-red-400",     Icon: ExclamationCircleIcon },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TransactionRow({ txn, uid }: { txn: any; uid: string }) {
  const cfg       = STATUS_CONFIG[txn.status] ?? STATUS_CONFIG.pending;
  const isBuyer   = txn.buyerId === uid;
  const other     = isBuyer ? txn.seller : txn.buyer;
  const otherName = other?.displayName ?? other?.name ?? "—";

  return (
    <Link
      href={`/transactions/${txn.id}`}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface p-4 transition hover:border-white/20"
    >
      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-surface2">
        {txn.card?.imageUrl && (
          <img src={txn.card.imageUrl} alt={txn.card.name} className="h-full w-full object-contain" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#F2F2F2]">{txn.card?.name ?? "—"}</p>
        <p className="text-[11px] text-[#9A9A9A]">{txn.card?.setName ?? ""}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#9A9A9A]">
          {isBuyer ? "Seller:" : "Buyer:"}
          <span className="font-medium text-[#F2F2F2]">{otherName}</span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-[#F2F2F2]">
          ₱{parseFloat(txn.agreedPrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>
        {txn.quantity > 1 && (
          <p className="text-[10px] text-[#9A9A9A]">×{txn.quantity}</p>
        )}
      </div>

      <div className={`shrink-0 flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
        <cfg.Icon className="size-4" />
        <span className="hidden sm:inline">{cfg.label}</span>
      </div>
    </Link>
  );
}

export default async function TransactionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

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

  const userIds = [...new Set(rows.flatMap((r) => [r.transaction.buyerId, r.transaction.sellerId]))];
  const users = userIds.length
    ? await db
        .select({ id: userTable.id, name: userTable.name, displayName: userTable.displayName, image: userTable.image })
        .from(userTable)
        .where(inArray(userTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const all = rows.map((r) => ({
    ...r.transaction,
    card:   r.card,
    buyer:  userMap[r.transaction.buyerId],
    seller: userMap[r.transaction.sellerId],
  }));

  const buying  = all.filter((t) => t.buyerId === uid);
  const selling = all.filter((t) => t.sellerId === uid);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-[#F2F2F2]">Transactions</h1>

      {all.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-2xl">🤝</p>
          <p className="font-semibold text-[#F2F2F2]">No transactions yet</p>
          <p className="text-sm text-[#9A9A9A]">
            Browse the marketplace to buy, or list a card to start selling.
          </p>
          <div className="mt-2 flex gap-3">
            <Link href="/marketplace" className="text-sm text-accent hover:underline">Browse marketplace</Link>
            <Link href="/listings/new" className="text-sm text-accent hover:underline">List a card</Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {buying.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
                Buying ({buying.length})
              </h2>
              <div className="space-y-2">
                {buying.map((t) => <TransactionRow key={t.id} txn={t} uid={uid} />)}
              </div>
            </section>
          )}

          {selling.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
                Selling ({selling.length})
              </h2>
              <div className="space-y-2">
                {selling.map((t) => <TransactionRow key={t.id} txn={t} uid={uid} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
