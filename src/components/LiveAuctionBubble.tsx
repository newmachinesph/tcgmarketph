"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AuctionSnippet {
  id:         string;
  currentBid: string | null;
  startingPrice: string | null;
  price:      string;
  auctionEnd: string | null;
  card:       { name: string };
}

function msLeft(iso: string | null) {
  if (!iso) return 0;
  return Math.max(0, new Date(iso).getTime() - Date.now());
}

function fmtShort(ms: number) {
  if (ms <= 0) return "Ended";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function LiveAuctionBubble() {
  const [auction, setAuction]   = useState<AuctionSnippet | null>(null);
  const [ms,      setMs]        = useState(0);

  useEffect(() => {
    fetch("/api/marketplace?type=auction&sort=newest&page=1")
      .then(r => r.json())
      .then(d => {
        const list: AuctionSnippet[] = d.listings ?? [];
        // Pick the one ending soonest (but not ended)
        const live = list
          .filter(a => a.auctionEnd && msLeft(a.auctionEnd) > 0)
          .sort((a, b) => msLeft(a.auctionEnd) - msLeft(b.auctionEnd))[0] ?? null;
        setAuction(live);
        if (live) setMs(msLeft(live.auctionEnd));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!auction) return;
    const t = setInterval(() => setMs(msLeft(auction.auctionEnd)), 1000);
    return () => clearInterval(t);
  }, [auction]);

  if (!auction) return null;

  const bid = auction.currentBid ?? auction.startingPrice ?? auction.price;
  const urgent = ms > 0 && ms < 3_600_000;

  return (
    <Link
      href={`/listings/${auction.id}`}
      className={`absolute right-0 top-6 z-30 rounded-2xl border bg-surface px-3 py-2 shadow-xl shadow-black/40 transition ${
        urgent
          ? "border-red-500/40 hover:border-red-500/60"
          : "border-orange-500/30 hover:border-orange-500/50"
      }`}
    >
      <p className={`text-[9px] font-bold uppercase tracking-widest ${urgent ? "text-red-400" : "text-orange-400"}`}>
        {urgent ? "🔴 Ending soon" : "🟠 Live Auction"}
      </p>
      <p className="mt-0.5 text-sm font-bold text-[#F2F2F2]">
        ₱{parseFloat(bid).toLocaleString("en-PH", { minimumFractionDigits: 0 })}
      </p>
      <p className="text-[10px] tabular-nums text-[#9A9A9A]">{fmtShort(ms)} left</p>
    </Link>
  );
}
