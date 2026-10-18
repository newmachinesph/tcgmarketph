"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Ably from "ably";
import {
  ClockIcon,
  FireIcon,
  ArrowUpIcon,
  TrophyIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

interface BidRow {
  id:          string;
  amount:      string;
  bidderName:  string;
  bidderImage: string | null;
  createdAt:   string;
}

interface Props {
  listingId:      string;
  startingPrice:  string;
  currentBid:     string | null;
  bidIncrement:   string | null;
  reservePrice:   string | null;
  auctionEnd:     string;
  isOwner:        boolean;
  isActive:       boolean;
  currentUserName?: string;
}

const ANTI_SNIPE = 30;

function phpFmt(price: string | number) {
  return "₱" + parseFloat(String(price)).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function useCountdown(endIso: string) {
  const [secs, setSecs] = useState(() =>
    Math.max(0, Math.floor((new Date(endIso).getTime() - Date.now()) / 1000))
  );
  const endRef = useRef(endIso);
  endRef.current = endIso;

  useEffect(() => {
    const t = setInterval(() => {
      setSecs(Math.max(0, Math.floor((new Date(endRef.current).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return secs;
}

function fmtCountdown(s: number) {
  if (s <= 0) return "Ended";
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

// Quick-bid increment presets (relative to minBid)
const QUICK_BUMPS = [
  { label: "+₱100",  add: 100  },
  { label: "+₱500",  add: 500  },
  { label: "+₱1k",   add: 1000 },
  { label: "+₱5k",   add: 5000 },
];

export function AuctionPanel({
  listingId, startingPrice, currentBid, bidIncrement,
  reservePrice, auctionEnd: initialEnd, isOwner, isActive, currentUserName,
}: Props) {
  const increment = parseFloat(bidIncrement ?? "50");

  const [liveEnd,    setLiveEnd]    = useState(initialEnd);
  const [liveBid,    setLiveBid]    = useState(currentBid);
  const [bidCount,   setBidCount]   = useState(0);
  const [bids,       setBids]       = useState<BidRow[]>([]);
  const [bidAmount,  setBidAmount]  = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bidError,   setBidError]   = useState("");
  const [justBid,    setJustBid]    = useState(false);
  const [, setTick] = useState(0);

  const secsLeft = useCountdown(liveEnd);
  const isSnipe  = secsLeft > 0 && secsLeft <= ANTI_SNIPE;
  const isEnded  = secsLeft <= 0;

  const minBid = liveBid
    ? parseFloat(liveBid) + increment
    : parseFloat(startingPrice);

  // Relative timestamps tick every 30s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Winning / outbid detection
  const topBidder   = bids[0]?.bidderName ?? null;
  const isWinning   = !!(currentUserName && topBidder && topBidder === currentUserName && !isEnded && bidCount > 0);
  const isOutbid    = !!(currentUserName && topBidder && topBidder !== currentUserName && !isEnded && bidCount > 0);

  // Reserve price progress
  const reservePct = reservePrice && liveBid
    ? Math.min(100, Math.round((parseFloat(liveBid) / parseFloat(reservePrice)) * 100))
    : null;
  const reserveMet = reservePrice && liveBid && parseFloat(liveBid) >= parseFloat(reservePrice);

  const loadBids = useCallback(async () => {
    const res  = await fetch(`/api/bids?listingId=${listingId}`);
    const data = await res.json();
    if (res.ok) {
      setBids(data.bids ?? []);
      setBidCount(data.bids?.length ?? 0);
    }
  }, [listingId]);

  useEffect(() => { loadBids(); }, [loadBids]);

  // Ably — live bid updates
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY) return;
    const client  = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY });
    const channel = client.channels.get(`auction:${listingId}`);

    channel.subscribe("bid", (msg) => {
      const d = msg.data as {
        amount: string; bidderName: string; currentBid: string;
        auctionEnd: string; bidCount: number;
      };
      setLiveBid(d.currentBid);
      setLiveEnd(d.auctionEnd);
      setBidCount(d.bidCount);
      setBids((prev) => [{
        id:          String(Date.now()),
        amount:      d.amount,
        bidderName:  d.bidderName,
        bidderImage: null,
        createdAt:   new Date().toISOString(),
      }, ...prev.slice(0, 19)]);
    });

    return () => { client.close(); };
  }, [listingId]);

  async function placeBid() {
    const num = parseFloat(bidAmount);
    if (!num || num < minBid) {
      setBidError(`Minimum bid is ${phpFmt(minBid)}`);
      return;
    }
    setSubmitting(true);
    setBidError("");
    const res  = await fetch("/api/bids", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ listingId, amount: num }),
    });
    const data = await res.json();
    if (!res.ok) {
      setBidError(data.error ?? "Bid failed");
    } else {
      setLiveBid(data.currentBid);
      setLiveEnd(data.auctionEnd);
      setBidCount(data.bidCount);
      setBidAmount("");
      setJustBid(true);
      setTimeout(() => setJustBid(false), 4000);
      loadBids();
    }
    setSubmitting(false);
  }

  function applyQuickBump(add: number) {
    setBidAmount(String(minBid + add));
    setBidError("");
  }

  return (
    <div className="space-y-4">

      {/* ── Winning / outbid banner ──────────────────────────────────── */}
      {isWinning && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
          <TrophyIcon className="size-4 shrink-0 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">You're winning this auction!</span>
        </div>
      )}
      {isOutbid && (
        <div className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2.5">
          <BellAlertIcon className="size-4 shrink-0 text-orange-400" />
          <span className="text-xs font-semibold text-orange-400">You've been outbid — place a higher bid!</span>
        </div>
      )}

      {/* ── Current bid + countdown ──────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${
        isSnipe ? "border-orange-400/40 bg-orange-400/5" : "border-white/10 bg-surface"
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
              {isEnded ? "Final bid" : "Current bid"}
            </p>
            <p className="mt-0.5 text-3xl font-bold text-[#F2F2F2]">
              {liveBid ? phpFmt(liveBid) : phpFmt(startingPrice)}
            </p>
            {!liveBid && (
              <p className="text-xs text-[#9A9A9A]">No bids yet — starting price</p>
            )}
            {bidCount > 0 && (
              <div className="mt-1 flex items-center gap-1.5">
                {!isEnded && (
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                  </span>
                )}
                <p className="text-xs text-[#9A9A9A]">
                  {bidCount} bid{bidCount !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
              {isEnded ? "Ended" : "Ends in"}
            </p>
            <p className={`mt-0.5 text-xl font-bold tabular-nums ${isSnipe ? "text-orange-400" : "text-[#F2F2F2]"}`}>
              {fmtCountdown(secsLeft)}
            </p>
            {isSnipe && !isEnded && (
              <p className="flex items-center justify-end gap-0.5 text-[10px] text-orange-400">
                <FireIcon className="size-3" /> Anti-snipe active
              </p>
            )}
            {isEnded && liveBid && bids[0] && (
              <p className="mt-0.5 text-[10px] text-emerald-400 font-medium">
                Won by {bids[0].bidderName}
              </p>
            )}
          </div>
        </div>

        {/* Reserve price bar */}
        {reservePrice && !isEnded && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] text-[#9A9A9A]">Reserve price</p>
              <p className={`text-[10px] font-semibold ${reserveMet ? "text-emerald-400" : "text-[#9A9A9A]"}`}>
                {reserveMet ? "✓ Met" : `${phpFmt(reservePrice)} (${reservePct ?? 0}%)`}
              </p>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-500 ${reserveMet ? "bg-emerald-500" : "bg-accent"}`}
                style={{ width: `${reservePct ?? 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Place bid ────────────────────────────────────────────────── */}
      {isActive && !isOwner && !isEnded && (
        <div className="rounded-2xl border border-white/10 bg-surface p-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-[#9A9A9A]">
              Min bid: <span className="font-bold text-[#F2F2F2]">{phpFmt(minBid)}</span>
              <span className="mx-1.5 text-white/20">·</span>
              increment: {phpFmt(increment)}
            </p>
          </div>

          {/* Quick-bid presets */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setBidAmount(String(minBid))}
              className="rounded-lg border border-white/10 bg-surface2 px-2.5 py-1 text-[11px] font-semibold text-[#9A9A9A] transition hover:border-accent/40 hover:text-accent"
            >
              Min
            </button>
            {QUICK_BUMPS.map(({ label, add }) => (
              <button
                key={add}
                onClick={() => applyQuickBump(add)}
                className="rounded-lg border border-white/10 bg-surface2 px-2.5 py-1 text-[11px] font-semibold text-[#9A9A9A] transition hover:border-accent/40 hover:text-accent"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Bid input + button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9A9A9A]">₱</span>
              <input
                type="number"
                min={minBid}
                step={increment}
                value={bidAmount}
                onChange={(e) => { setBidAmount(e.target.value); setBidError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") placeBid(); }}
                placeholder={String(minBid)}
                className="w-full rounded-xl border border-white/10 bg-surface2 py-2.5 pl-7 pr-3 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
              />
            </div>
            <button
              onClick={placeBid}
              disabled={submitting || !bidAmount}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/80 disabled:opacity-50"
            >
              <ArrowUpIcon className="size-4" />
              {submitting ? "Placing…" : "Bid"}
            </button>
          </div>

          {bidError && <p className="text-xs text-red-400">{bidError}</p>}
          {justBid  && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <TrophyIcon className="size-3.5" /> Bid placed — you&apos;re in the lead!
            </div>
          )}
        </div>
      )}

      {isOwner && !isEnded && (
        <p className="rounded-xl bg-surface2 px-3 py-2 text-xs text-[#9A9A9A]">
          You cannot bid on your own auction.
        </p>
      )}

      {isEnded && (
        <p className="rounded-xl bg-surface2 px-3 py-2 text-xs text-[#9A9A9A]">
          This auction has ended.
          {liveBid
            ? ` Final bid: ${phpFmt(liveBid)}${bids[0] ? ` — won by ${bids[0].bidderName}.` : "."}`
            : " No bids were placed."}
        </p>
      )}

      {/* ── Bid history ──────────────────────────────────────────────── */}
      {bids.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">
              Bid history
            </p>
            <p className="text-[10px] text-[#9A9A9A]">
              {bidCount > bids.length ? `showing last ${bids.length} of ${bidCount}` : `${bidCount} total`}
            </p>
          </div>
          <div className="space-y-1.5">
            {bids.map((b, i) => (
              <div
                key={b.id}
                className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                  i === 0 ? "bg-accent/10 border border-accent/20" : "bg-surface2"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                    i === 0 ? "bg-accent/20 text-accent" : "bg-white/10 text-[#9A9A9A]"
                  }`}>
                    {b.bidderName.charAt(0).toUpperCase()}
                  </div>
                  <span className={`truncate text-xs font-medium ${i === 0 ? "text-accent" : "text-[#9A9A9A]"}`}>
                    {b.bidderName}
                    {i === 0 && !isEnded && " 🏆"}
                    {i === 0 && isEnded && " (winner)"}
                  </span>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className={`text-xs font-bold ${i === 0 ? "text-[#F2F2F2]" : "text-[#9A9A9A]"}`}>
                    {phpFmt(b.amount)}
                  </span>
                  <span className="text-[9px] text-[#9A9A9A]/70 tabular-nums">
                    {relTime(b.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No bids yet */}
      {bids.length === 0 && !isEnded && isActive && (
        <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center">
          <p className="text-xs font-medium text-[#9A9A9A]">No bids yet</p>
          {!isOwner && (
            <p className="mt-0.5 text-[11px] text-[#9A9A9A]/70">
              Be the first to bid — starting at {phpFmt(startingPrice)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
