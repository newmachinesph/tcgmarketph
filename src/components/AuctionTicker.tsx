"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ClockIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

interface AuctionItem {
  id:            string;
  price:         string;
  currentBid:    string | null;
  startingPrice: string | null;
  auctionEnd:    string | null;
  bidCount:      number;
  coverPhoto:    string | null;
  card: {
    name:     string;
    setName:  string | null;
    game:     string;
    imageUrl: string | null;
  };
}

function timeLeft(endIso: string | null): { text: string; urgent: boolean } {
  if (!endIso) return { text: "—", urgent: false };
  const ms = new Date(endIso).getTime() - Date.now();
  if (ms <= 0) return { text: "Ended", urgent: false };
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return { text: `${h}h ${m}m`, urgent: h < 2 };
  if (m > 0) return { text: `${m}m ${sec}s`, urgent: true };
  return { text: `${sec}s`, urgent: true };
}

function phpFmt(val: string | null) {
  if (!val) return "—";
  return "₱" + parseFloat(val).toLocaleString("en-PH", { minimumFractionDigits: 0 });
}

export function AuctionTicker() {
  const [auctions, setAuctions] = useState<AuctionItem[]>([]);
  const [, tick] = useState(0);

  useEffect(() => {
    fetch("/api/marketplace?type=auction&sort=newest")
      .then((r) => r.json())
      .then((d) => setAuctions((d.listings ?? []).slice(0, 6)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!auctions.length) return null;

  return (
    <section className="border-b border-white/8 bg-surface/30 px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-screen-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-400">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-orange-400" />
              </span>
              Live Auctions
            </span>
            <p className="hidden text-sm text-[#9A9A9A] sm:block">
              Ending soon — bid before time runs out
            </p>
          </div>
          <Link
            href="/auction"
            className="flex items-center gap-1.5 text-sm font-medium text-orange-400 transition hover:text-orange-300"
          >
            See all
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        {/* Auction cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {auctions.map((a) => {
            const { text, urgent } = timeLeft(a.auctionEnd);
            const bid = a.currentBid ?? a.startingPrice ?? a.price;
            const hasBids = !!a.currentBid;

            return (
              <Link
                key={a.id}
                href={`/listings/${a.id}`}
                className={`group flex w-44 shrink-0 flex-col overflow-hidden rounded-2xl border bg-surface transition hover:shadow-lg hover:shadow-orange-500/5 ${
                  urgent
                    ? "border-red-500/40 hover:border-red-500/60"
                    : "border-white/10 hover:border-orange-500/30"
                }`}
              >
                {/* Image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface2">
                  {a.coverPhoto || a.card.imageUrl ? (
                    <img
                      src={a.coverPhoto ?? a.card.imageUrl!}
                      alt={a.card.name}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">🃏</div>
                  )}
                  {/* Time badge */}
                  <div className={`absolute bottom-2 left-2 right-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${
                    urgent ? "bg-red-500/90 text-white" : "bg-black/70 text-[#F2F2F2]"
                  }`}>
                    <ClockIcon className="size-3 shrink-0" />
                    {text}
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="line-clamp-1 text-xs font-semibold text-[#F2F2F2]">{a.card.name}</p>
                  <p className="line-clamp-1 text-[10px] text-[#9A9A9A]">{a.card.setName ?? ""}</p>
                  <div className="mt-auto pt-1">
                    <p className="text-[9px] text-[#9A9A9A]">
                      {hasBids ? "Current bid" : "Starting at"}
                    </p>
                    <p className="text-sm font-bold text-[#F2F2F2]">{phpFmt(bid)}</p>
                    {hasBids && (
                      <p className="text-[9px] text-[#9A9A9A]">
                        {a.bidCount} bid{a.bidCount !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
