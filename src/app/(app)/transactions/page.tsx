"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

export default function TransactionsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [all, setAll]         = useState<any[]>([]);
  const [uid, setUid]         = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setAll(d.transactions ?? []);
        // derive uid from first row if available
        if (d.uid) setUid(d.uid);
        else if (d.transactions?.length) {
          // fallback: figure out uid from role field
          const first = d.transactions[0];
          setUid(first.role === "buyer" ? first.buyerId : first.sellerId);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const buying  = all.filter((t) => t.role === "buyer");
  const selling = all.filter((t) => t.role === "seller");

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-[#F2F2F2]">Transactions</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm text-red-400">Could not load transactions. Please try again.</p>
        </div>
      ) : all.length === 0 ? (
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
