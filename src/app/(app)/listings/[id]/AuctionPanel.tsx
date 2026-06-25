"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Ably from "ably";
import {
  ClockIcon,
  FireIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";

interface BidRow {
  id:          string;
  amount:      string;
  bidderName:  string;
  bidderImage: string | null;
  createdAt:   string;
}

interface Props {
  listingId:    string;
  startingPrice: string;
  currentBid:   string | null;
  bidIncrement: string | null;
  reservePrice: string | null;
  auctionEnd:   string;
  isOwner:      boolean;
  isActive:     boolean;
}

const ANTI_SNIPE = 30; // must match server

function phpFmt(price: string | number) {
  return "₱" + parseFloat(String(price)).toLocaleString("en-PH", { minimumFractionDigits: 2 });
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
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function AuctionPanel({
  listingId, startingPrice, currentBid, bidIncrement,
  reservePrice, auctionEnd: initialEnd, isOwner, isActive,
}: Props) {
  const increment   = parseFloat(bidIncrement ?? "50");
  const [liveEnd, setLiveEnd]         = useState(initialEnd);
  const [liveBid, setLiveBid]         = useState(currentBid);
  const [bidCount, setBidCount]       = useState(0);
  const [bids, setBids]               = useState<BidRow[]>([]);
  const [bidAmount, setBidAmount]     = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [bidError, setBidError]       = useState("");
  const [justBid, setJustBid]         = useState(false);
  const secsLeft = useCountdown(liveEnd);
  const isSnipe  = secsLeft > 0 && secsLeft <= ANTI_SNIPE;
  const isEnded  = secsLeft <= 0;

  const minBid = liveBid
    ? parseFloat(liveBid) + increment
    : parseFloat(startingPrice);

  const loadBids = useCallback(async () => {
    const res  = await fetch(`/api/bids?listingId=${listingId}`);
    const data = await res.json();
    if (res.ok) {
      setBids(data.bids ?? []);
      setBidCount(data.bids?.length ?? 0);
    }
  }, [listingId]);

  // Initial bid history load
  useEffect(() => { loadBids(); }, [loadBids]);

  // Ably subscription for live bid updates
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
      // Prepend new bid row optimistically
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
      setTimeout(() => setJustBid(false), 3000);
      loadBids();
    }
    setSubmitting(false);
  }

  return (
    <div className="space-y-4">
      {/* Countdown + current bid */}
      <div className={`rounded-2xl border p-5 ${isSnipe ? "border-orange-400/40 bg-orange-400/5" : "border-white/10 bg-surface"}`}>
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
              <p className="mt-0.5 text-xs text-[#9A9A9A]">{bidCount} bid{bidCount !== 1 ? "s" : ""}</p>
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
              <p className="flex items-center gap-0.5 text-[10px] text-orange-400">
                <FireIcon className="size-3" /> Anti-snipe active
              </p>
            )}
          </div>
        </div>

        {reservePrice && !isEnded && (
          <p className="mt-2 text-[10px] text-[#9A9A9A]">
            Reserve: {phpFmt(reservePrice)}
            {liveBid && parseFloat(liveBid) >= parseFloat(reservePrice)
              ? " — ✅ met"
              : " — not yet met"}
          </p>
        )}
      </div>

      {/* Place bid */}
      {isActive && !isOwner && !isEnded && (
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <p className="mb-2 text-xs font-medium text-[#9A9A9A]">
            Min bid: <span className="font-bold text-[#F2F2F2]">{phpFmt(minBid)}</span>
            {" · "}increment: {phpFmt(increment)}
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9A9A9A]">₱</span>
              <input
                type="number"
                min={minBid}
                step={increment}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
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
              {submitting ? "Bidding…" : "Bid"}
            </button>
          </div>
          {bidError && <p className="mt-1.5 text-xs text-red-400">{bidError}</p>}
          {justBid && <p className="mt-1.5 text-xs text-emerald-400">Bid placed!</p>}
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
          {liveBid ? ` Winning bid: ${phpFmt(liveBid)}.` : " No bids were placed."}
        </p>
      )}

      {/* Bid history */}
      {bids.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Bid history</p>
          <div className="space-y-1.5">
            {bids.map((b, i) => (
              <div key={b.id} className={`flex items-center justify-between rounded-xl px-3 py-2 ${i === 0 ? "bg-accent/10 border border-accent/20" : "bg-surface2"}`}>
                <span className={`text-xs font-medium ${i === 0 ? "text-accent" : "text-[#9A9A9A]"}`}>
                  {b.bidderName}
                  {i === 0 && " 🏆"}
                </span>
                <span className={`text-xs font-bold ${i === 0 ? "text-[#F2F2F2]" : "text-[#9A9A9A]"}`}>
                  {phpFmt(b.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
