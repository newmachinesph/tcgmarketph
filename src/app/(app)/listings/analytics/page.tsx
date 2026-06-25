"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftIcon,
  ChartBarIcon,
  TagIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ListingStat {
  id:         string;
  cardName:   string;
  imageUrl:   string | null;
  status:     string;
  type:       string;
  price:      string;
  createdAt:  string;
  views:      number;
  offerCount: number;
}

interface Summary {
  activeListings: number;
  viewsThisMonth: number;
  offersReceived: number;
  dealsClosed:    number;
}

interface DayRow   { date: string; views: number }
interface Funnel   { total: number; pending: number; accepted: number; declined: number; countered: number; cancelled: number; expired: number }
interface Detail   { dailyViews: DayRow[]; offerFunnel: Funnel }

const STATUS_STYLE: Record<string, string> = {
  active:    "bg-emerald-400/10 text-emerald-400",
  paused:    "bg-yellow-400/10 text-yellow-400",
  sold:      "bg-sky-400/10 text-sky-400",
  cancelled: "bg-rose-400/10 text-rose-400",
  expired:   "bg-white/10 text-[#9A9A9A]",
};

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: DayRow[] }) {
  if (data.length === 0) {
    return <p className="text-xs text-[#9A9A9A]">No view data yet.</p>;
  }
  const W = 200, H = 40, max = Math.max(...data.map((d) => d.views), 1);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * W;
    const y = H - (d.views / max) * H;
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[200px]" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="#E24B4A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts.join(" ")}
      />
    </svg>
  );
}

// ── Offer funnel bar ──────────────────────────────────────────────────────────

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-[#9A9A9A]">{label}</span>
        <span className="font-semibold text-[#F2F2F2]">{value} <span className="text-[#9A9A9A] font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Expanded detail row ───────────────────────────────────────────────────────

function ListingDetail({ id }: { id: string }) {
  const [data, setData]       = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/listings/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="h-20 animate-pulse rounded-xl bg-surface2" />;
  if (!data)   return <p className="text-xs text-[#9A9A9A]">Failed to load detail.</p>;

  const { dailyViews, offerFunnel: f } = data;
  const totalViews = dailyViews.reduce((s, d) => s + d.views, 0);

  return (
    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Daily views */}
      <div className="rounded-xl bg-surface2 p-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A]">
          Views — last 30 days ({totalViews} total)
        </p>
        <Sparkline data={dailyViews} />
        {dailyViews.length > 0 && (
          <p className="text-[10px] text-[#9A9A9A]">
            Peak: {Math.max(...dailyViews.map((d) => d.views))} on{" "}
            {new Date(dailyViews.reduce((a, b) => a.views >= b.views ? a : b).date)
              .toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>

      {/* Offer funnel */}
      <div className="rounded-xl bg-surface2 p-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A]">
          Offer funnel ({f.total} total)
        </p>
        {f.total === 0 ? (
          <p className="text-xs text-[#9A9A9A]">No offers received yet.</p>
        ) : (
          <div className="space-y-2">
            <FunnelBar label="Accepted"  value={f.accepted}  total={f.total} color="bg-emerald-400" />
            <FunnelBar label="Pending"   value={f.pending}   total={f.total} color="bg-yellow-400" />
            <FunnelBar label="Declined"  value={f.declined}  total={f.total} color="bg-red-400"     />
            <FunnelBar label="Countered" value={f.countered} total={f.total} color="bg-purple-400"  />
            <FunnelBar label="Expired"   value={f.expired}   total={f.total} color="bg-white/20"    />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ListingAnalyticsPage() {
  const [summary, setSummary]     = useState<Summary | null>(null);
  const [rows, setRows]           = useState<ListingStat[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<string | null>(null);

  const load = useCallback(async () => {
    const res  = await fetch("/api/analytics/listings");
    const data = await res.json();
    if (res.ok) {
      setSummary(data.summary);
      setRows(data.listings ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const SUMMARY_CARDS = summary ? [
    { label: "Active listings",   value: summary.activeListings,  color: "text-emerald-400" },
    { label: "Views this month",  value: summary.viewsThisMonth,  color: "text-sky-400"     },
    { label: "Offers received",   value: summary.offersReceived,  color: "text-purple-400"  },
    { label: "Deals closed",      value: summary.dealsClosed,     color: "text-bid"         },
  ] : [];

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-10 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/listings" className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          <ChartBarIcon className="size-5 text-[#9A9A9A]" />
          <h1 className="text-xl font-bold text-[#F2F2F2]">Listing Analytics</h1>
        </div>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SUMMARY_CARDS.map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-surface p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-[#9A9A9A]">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Listing table */}
      {!loading && rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-16 text-center">
          <TagIcon className="mx-auto mb-3 size-10 text-white/10" />
          <p className="text-sm text-[#9A9A9A]">No listings yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {loading
            ? [1,2,3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />)
            : rows.map((r) => {
                const isOpen = expanded === r.id;
                return (
                  <div key={r.id} className="rounded-2xl border border-white/10 bg-surface">
                    <div className="flex items-center gap-3 p-4">
                      {/* Thumbnail */}
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface2">
                        {r.imageUrl ? (
                          <Image src={r.imageUrl} alt={r.cardName} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-white/20">
                            <TagIcon className="size-5" />
                          </div>
                        )}
                      </div>

                      {/* Name + status */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="truncate text-sm font-semibold text-[#F2F2F2]">{r.cardName}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] ?? ""}`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#9A9A9A]">
                          ₱{parseFloat(r.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex shrink-0 items-center gap-4 text-xs text-[#9A9A9A]">
                        <div className="flex items-center gap-1 text-center">
                          <EyeIcon className="size-3.5" />
                          <span className="font-semibold text-[#F2F2F2]">{r.views}</span>
                          <span className="hidden sm:inline">views</span>
                        </div>
                        <div className="text-center">
                          <span className="font-semibold text-[#F2F2F2]">{r.offerCount}</span>
                          <span className="ml-1 hidden sm:inline">offers</span>
                        </div>
                        <button
                          onClick={() => setExpanded(isOpen ? null : r.id)}
                          className="flex size-7 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
                          aria-label={isOpen ? "Collapse" : "Expand"}
                        >
                          {isOpen
                            ? <ChevronUpIcon   className="size-3.5" />
                            : <ChevronDownIcon className="size-3.5" />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="border-t border-white/10 px-4 pb-4">
                        <ListingDetail id={r.id} />
                      </div>
                    )}
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}
