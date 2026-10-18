"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TagIcon, XMarkIcon, BanknotesIcon } from "@heroicons/react/24/outline";

interface Props {
  listingId:             string;
  maxQty:                number;
  price:                 string;
  cardName:              string;
  onlinePaymentsEnabled?: boolean;
}

export function BuyNowButton({ listingId, maxQty, price, cardName, onlinePaymentsEnabled = false }: Props) {
  const router = useRouter();
  const [open, setOpen]         = useState(false);
  const [qty, setQty]           = useState(1);
  const [note, setNote]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function submit() {
    setLoading(true);
    setError("");
    const res  = await fetch("/api/transactions", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ listingId, quantity: qty, buyerNote: note || undefined, method: "cash_meetup" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not commit to purchase.");
      setLoading(false);
      return;
    }
    router.push(`/transactions/${data.transaction.id}`);
  }

  const total = parseFloat(price) * qty;
  const fmt   = (n: number) => "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent/80"
      >
        <TagIcon className="size-4" /> Buy Now
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-primary p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-[#F2F2F2]">Commit to buy</h2>
                <p className="text-xs text-[#9A9A9A]">{cardName}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#9A9A9A] hover:text-[#F2F2F2]">
                <XMarkIcon className="size-5" />
              </button>
            </div>

            {maxQty > 1 && (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">
                  Quantity (max {maxQty})
                </label>
                <input
                  type="number"
                  min={1}
                  max={maxQty}
                  value={qty}
                  onChange={(e) => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-24 rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] focus:border-white/20 focus:outline-none"
                />
              </div>
            )}

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">
                Message to seller (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Availability, preferred area…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
              />
            </div>

            {/* Payment method */}
            <div className="mb-4 rounded-xl bg-surface p-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#9A9A9A]">Total</span>
                <span className="font-bold text-[#F2F2F2]">{fmt(total)}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <BanknotesIcon className="size-4 shrink-0 text-emerald-400" />
                <p className="text-[11px] text-[#9A9A9A]">
                  Cash on meetup — the seller will confirm and you&apos;ll arrange a safe meetup.
                </p>
              </div>
              {onlinePaymentsEnabled && (
                <p className="mt-1 text-[10px] text-[#9A9A9A]">QR Ph payment also available at checkout.</p>
              )}
            </div>

            {error && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent/80 disabled:opacity-50"
            >
              {loading ? "Confirming…" : "Confirm purchase request"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
