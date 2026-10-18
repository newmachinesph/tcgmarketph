"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ClockIcon, TrophyIcon } from "@heroicons/react/24/outline";

interface BidEntry {
  listingId: string;
  topBid:    string | null;
  listing: {
    id:           string;
    status:       string;
    currentBid:   string | null;
    startingPrice: string | null;
    auctionEnd:   string | null;
    sellerId:     string;
  };
  card: {
    name:     string;
    setName:  string | null;
    game:     string;
    imageUrl: string | null;
  };
}

function phpFmt(price: string | number | null) {
  if (!price) return "—";
  return "₱" + parseFloat(String(price)).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function timeLeft(endIso: string | null) {
  if (!endIso) return null;
  const ms = new Date(endIso).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h > 0)  return `${h}h ${m}m left`;
  return `${m}m left`;
}

export default function MyBidsPage() {
  const [entries, setEntries] = useState<BidEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bids/mine")
      .then((r) => r.json())
      .then((d) => setEntries(d.bids ?? []))
      .finally(() => setLoading(false));
  }, []);

  const active   = entries.filter((e) => e.listing.status === "active");
  const finished = entries.filter((e) => e.listing.status !== "active");

  function isWinning(e: BidEntry) {
    return e.topBid && e.listing.currentBid && e.topBid === e.listing.currentBid;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-[#F2F2F2]">My Bids</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-2xl">🎯</p>
          <p className="font-semibold text-[#F2F2F2]">No bids yet</p>
          <p className="text-sm text-[#9A9A9A]">Browse the marketplace for active auctions.</p>
          <Link href="/marketplace" className="mt-1 text-sm text-accent hover:underline">Browse marketplace</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
                Active auctions ({active.length})
              </h2>
              <div className="space-y-2">
                {active.map((e) => (
                  <Link
                    key={e.listingId}
                    href={`/listings/${e.listingId}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface p-4 transition hover:border-white/20"
                  >
                    {e.card.imageUrl && (
                      <img src={e.card.imageUrl} alt={e.card.name}
                        className="size-12 shrink-0 rounded-lg object-contain bg-surface2" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#F2F2F2]">{e.card.name}</p>
                      <p className="text-[11px] text-[#9A9A9A]">{e.card.setName ?? ""}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-[#9A9A9A]">Your bid</p>
                      <p className="font-bold text-[#F2F2F2]">{phpFmt(e.topBid)}</p>
                      {isWinning(e) ? (
                        <p className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                          <TrophyIcon className="size-3" /> Winning
                        </p>
                      ) : (
                        <p className="text-[10px] text-red-400">Outbid — current: {phpFmt(e.listing.currentBid)}</p>
                      )}
                      <p className="mt-0.5 flex items-center gap-0.5 text-[10px] text-[#9A9A9A]">
                        <ClockIcon className="size-3" />
                        {timeLeft(e.listing.auctionEnd)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {finished.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
                Past auctions ({finished.length})
              </h2>
              <div className="space-y-2">
                {finished.map((e) => {
                  const won = e.listing.status === "sold" && isWinning(e);
                  return (
                    <Link
                      key={e.listingId}
                      href={`/listings/${e.listingId}`}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface p-4 transition hover:border-white/20 opacity-80"
                    >
                      {e.card.imageUrl && (
                        <img src={e.card.imageUrl} alt={e.card.name}
                          className="size-12 shrink-0 rounded-lg object-contain bg-surface2 grayscale" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#F2F2F2]">{e.card.name}</p>
                        <p className="text-[11px] text-[#9A9A9A]">{e.card.setName ?? ""}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-[#F2F2F2]">{phpFmt(e.topBid)}</p>
                        {won ? (
                          <p className="flex items-center gap-0.5 text-[10px] font-semibold text-yellow-400">
                            <TrophyIcon className="size-3" /> Won
                          </p>
                        ) : (
                          <p className="text-[10px] text-[#9A9A9A]">
                            {e.listing.status === "sold" ? "Lost" : e.listing.status}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
