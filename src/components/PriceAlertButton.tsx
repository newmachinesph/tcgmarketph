"use client";

import { useState } from "react";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

export function PriceAlertButton({
  listingId,
  currentPrice,
}: {
  listingId:    string;
  currentPrice: string;
}) {
  const [open, setOpen]   = useState(false);
  const [price, setPrice] = useState(
    String(Math.floor(parseFloat(currentPrice) * 0.9))
  );
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    const num = parseFloat(price);
    if (isNaN(num) || num <= 0) { toast.error("Enter a valid price"); return; }
    setSaving(true);
    const res = await fetch("/api/price-alerts", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ listingId, targetPrice: String(num.toFixed(2)) }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setOpen(false);
      toast.success("Price alert set — we'll notify you when the price drops.");
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Failed to set alert");
    }
  }

  if (saved) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border border-bid/20 bg-bid/10 px-4 py-2.5 text-sm font-medium text-bid">
        <CheckIcon className="size-4" />
        Alert set
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface2 px-4 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
      >
        <BellIcon className="size-4" />
        Price alert
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border border-white/10 bg-surface p-4 shadow-xl">
          <p className="mb-3 text-sm font-medium text-[#F2F2F2]">Alert me when price drops to:</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#9A9A9A]">₱</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="1"
              step="1"
              className="flex-1 rounded-lg border border-white/10 bg-surface2 px-3 py-1.5 text-sm text-[#F2F2F2] focus:border-white/20 focus:outline-none"
            />
          </div>
          <p className="mt-1.5 text-[10px] text-[#9A9A9A]">
            Current price: ₱{parseFloat(currentPrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Set Alert"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9A9A9A] transition hover:text-[#F2F2F2]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
