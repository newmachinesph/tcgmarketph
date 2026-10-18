"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OfferUser {
  id:          string;
  name:        string;
  displayName: string | null;
  image:       string | null;
}

interface Offer {
  id:             string;
  listingId:      string;
  buyerId:        string;
  sellerId:       string;
  offeredPrice:   string;
  message:        string | null;
  counterPrice:   string | null;
  counterMessage: string | null;
  transactionId:  string | null;
  status:         string;
  expiresAt:      string;
  createdAt:      string;
  role:           "buyer" | "seller";
  card: { name: string; setName: string | null; game: string; imageUrl: string | null };
  buyer:  OfferUser;
  seller: OfferUser;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pending",   color: "text-yellow-400" },
  countered: { label: "Countered", color: "text-blue-400" },
  accepted:  { label: "Accepted",  color: "text-emerald-400" },
  declined:  { label: "Declined",  color: "text-red-400" },
  cancelled: { label: "Cancelled", color: "text-[#9A9A9A]" },
  expired:   { label: "Expired",   color: "text-[#9A9A9A]" },
};

function phpFmt(price: string) {
  return "₱" + parseFloat(price).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

// ── Offer card ────────────────────────────────────────────────────────────────

function OfferCard({
  offer,
  onAction,
  working,
}: {
  offer: Offer;
  onAction: (id: string, payload: object) => void;
  working: boolean;
}) {
  const [showCounter, setShowCounter] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const cfg        = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.pending;
  const isBuyer    = offer.role === "buyer";
  const other      = isBuyer ? offer.seller : offer.buyer;
  const otherName  = other?.displayName ?? other?.name ?? "—";
  const isOpen     = offer.status === "pending" || offer.status === "countered";

  const expiresIn = Math.max(0, Math.ceil((new Date(offer.expiresAt).getTime() - Date.now()) / 3_600_000));

  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {offer.card.imageUrl && (
          <img src={offer.card.imageUrl} alt={offer.card.name}
            className="size-12 shrink-0 rounded-lg object-contain bg-surface2" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[#F2F2F2]">{offer.card.name}</p>
            <span className={`shrink-0 text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>
          <p className="text-[11px] text-[#9A9A9A]">{offer.card.setName ?? ""}</p>
          <p className="mt-0.5 text-[11px] text-[#9A9A9A]">
            {isBuyer ? "Seller:" : "Buyer:"}{" "}
            <span className="font-medium text-[#F2F2F2]">{otherName}</span>
          </p>
        </div>
      </div>

      {/* Prices */}
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#9A9A9A]">Offered</p>
          <p className="font-bold text-[#F2F2F2]">{phpFmt(offer.offeredPrice)}</p>
        </div>
        {offer.counterPrice && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#9A9A9A]">Counter</p>
            <p className="font-bold text-blue-400">{phpFmt(offer.counterPrice)}</p>
          </div>
        )}
      </div>

      {offer.message && (
        <p className="mt-2 rounded-lg bg-surface2 px-3 py-1.5 text-xs text-[#9A9A9A]">
          &ldquo;{offer.message}&rdquo;
        </p>
      )}
      {offer.counterMessage && (
        <p className="mt-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs text-blue-300">
          Counter note: &ldquo;{offer.counterMessage}&rdquo;
        </p>
      )}

      {isOpen && (
        <p className="mt-2 text-[10px] text-[#9A9A9A]">
          <ClockIcon className="mb-0.5 mr-0.5 inline size-3" />
          Expires in {expiresIn}h
        </p>
      )}

      {/* Accepted → link to transaction */}
      {offer.status === "accepted" && offer.transactionId && (
        <div className="mt-3">
          <Link
            href={`/transactions/${offer.transactionId}`}
            className="text-sm font-medium text-emerald-400 hover:underline"
          >
            View transaction →
          </Link>
        </div>
      )}

      {/* Action buttons */}
      {isOpen && (
        <div className="mt-3 flex flex-wrap gap-2">
          {/* SELLER actions on pending offer */}
          {!isBuyer && offer.status === "pending" && (
            <>
              <button
                onClick={() => onAction(offer.id, { action: "accept" })}
                disabled={working}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => setShowCounter((v) => !v)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-[#9A9A9A] hover:text-[#F2F2F2]"
              >
                Counter
              </button>
              <button
                onClick={() => onAction(offer.id, { action: "decline" })}
                disabled={working}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                Decline
              </button>
            </>
          )}

          {/* BUYER actions on countered offer */}
          {isBuyer && offer.status === "countered" && (
            <>
              <button
                onClick={() => onAction(offer.id, { action: "accept_counter" })}
                disabled={working}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
              >
                Accept counter ({phpFmt(offer.counterPrice ?? "0")})
              </button>
              <button
                onClick={() => onAction(offer.id, { action: "decline_counter" })}
                disabled={working}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              >
                Decline counter
              </button>
            </>
          )}

          {/* BUYER cancel */}
          {isBuyer && (
            <button
              onClick={() => onAction(offer.id, { action: "cancel" })}
              disabled={working}
              className="ml-auto rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9A9A9A] hover:text-[#F2F2F2] disabled:opacity-50"
            >
              Cancel offer
            </button>
          )}
        </div>
      )}

      {/* Counter form (seller) */}
      {showCounter && (
        <div className="mt-3 rounded-xl border border-white/10 bg-surface2 p-3 space-y-2">
          <input
            type="number"
            placeholder="Counter price (₱)"
            min={1}
            value={counterPrice}
            onChange={(e) => setCounterPrice(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
          <textarea
            placeholder="Message (optional)"
            rows={2}
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                const num = parseFloat(counterPrice);
                if (!num) return;
                onAction(offer.id, { action: "counter", counterPrice: num, counterMessage: counterMessage || undefined });
                setShowCounter(false);
              }}
              disabled={working || !counterPrice}
              className="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
            >
              Send counter
            </button>
            <button onClick={() => setShowCounter(false)} className="text-xs text-[#9A9A9A] hover:text-[#F2F2F2]">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "buying" | "selling";

export default function OffersPage() {
  const router = useRouter();
  const [all, setAll]         = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError]     = useState("");
  const [tab, setTab]         = useState<Tab>("buying");

  const load = useCallback(async () => {
    const res  = await fetch("/api/offers");
    const data = await res.json();
    if (res.ok) setAll(data.offers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAction(id: string, payload: object) {
    setWorking(true);
    setError("");
    const res  = await fetch(`/api/offers/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setWorking(false);
      return;
    }
    // If accepted, redirect to the new transaction
    if (data.transactionId) {
      router.push(`/transactions/${data.transactionId}`);
      return;
    }
    await load();
    setWorking(false);
  }

  const buying  = all.filter((o) => o.role === "buyer");
  const selling = all.filter((o) => o.role === "seller");
  const shown   = tab === "buying" ? buying : selling;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-[#F2F2F2]">Offers</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-surface p-1">
        {(["buying", "selling"] as Tab[]).map((t) => {
          const count = t === "buying" ? buying.length : selling.length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium capitalize transition ${
                tab === t ? "bg-surface2 text-[#F2F2F2]" : "text-[#9A9A9A] hover:text-[#F2F2F2]"
              }`}
            >
              {t}
              {count > 0 && (
                <span className="rounded-full bg-accent/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-2xl">💬</p>
          <p className="font-semibold text-[#F2F2F2]">
            {tab === "buying" ? "No offers made yet" : "No offers received yet"}
          </p>
          <p className="text-sm text-[#9A9A9A]">
            {tab === "buying"
              ? "Browse the marketplace and make an offer on a listing."
              : "Once buyers make offers on your listings, they'll appear here."}
          </p>
          {tab === "buying" && (
            <Link href="/marketplace" className="mt-1 text-sm text-accent hover:underline">
              Browse marketplace
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((o) => (
            <OfferCard key={o.id} offer={o} onAction={handleAction} working={working} />
          ))}
        </div>
      )}
    </div>
  );
}
