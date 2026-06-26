"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
  listingId:    string;
  listingPrice: string;
  cardName:     string;
}

export function MakeOfferButton({ listingId, listingPrice, cardName }: Props) {
  const router = useRouter();
  const [open, setOpen]         = useState(false);
  const [price, setPrice]       = useState("");
  const [message, setMessage]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const asking = parseFloat(listingPrice);

  async function submit() {
    const num = parseFloat(price);
    if (!num || num <= 0) { setError("Enter a valid price"); return; }
    setLoading(true);
    setError("");
    const res  = await fetch("/api/offers", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ listingId, offeredPrice: num, message: message || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Could not submit offer"); setLoading(false); return; }
    router.push("/offers");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
      >
        <ChatBubbleLeftRightIcon className="size-4" /> Make Offer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-primary p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-[#F2F2F2]">Make an offer</h2>
                <p className="text-xs text-[#9A9A9A]">{cardName} · asking ₱{asking.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[#9A9A9A] hover:text-[#F2F2F2]">
                <XMarkIcon className="size-5" />
              </button>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Your offer (₱)</label>
              <input
                type="number"
                min={1}
                placeholder={`e.g. ${Math.round(asking * 0.9).toLocaleString()}`}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">
                Message to seller (optional)
              </label>
              <textarea
                rows={2}
                placeholder="Reason, availability…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
              />
            </div>

            <p className="mb-4 text-[10px] text-[#9A9A9A]">
              Offer expires in 48 hours. Seller can accept, decline, or counter. One open offer per listing.
            </p>

            {error && (
              <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={loading || !price}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent/80 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send offer"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
