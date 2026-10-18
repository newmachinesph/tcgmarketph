"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  EyeIcon,
  TagIcon,
  CheckCircleIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";

interface ListingRow {
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

interface DailyView { date: string; views: number }
interface OfferFunnel { total: number; pending: number; accepted: number; declined: number; countered: number; cancelled: number; expired: number }
interface Detail { dailyViews: DailyView[]; offerFunnel: OfferFunnel }

const STATUS_CHIP: Record<string, string> = {
  active:    "bg-bid/10 text-bid",
  sold:      "bg-accent/10 text-accent",
  expired:   "bg-white/5 text-[#9A9A9A]",
  cancelled: "bg-white/5 text-[#9A9A9A]",
  paused:    "bg-yellow-400/10 text-yellow-400",
};

function phpFmt(price: string) {
  return "₱" + parseFloat(price).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

function Sparkline({ data }: { data: DailyView[] }) {
  if (data.length === 0) return <p className="text-xs text-[#9A9A9A]">No view data yet.</p>;

  const max  = Math.max(...data.map((d) => d.views), 1);
  const W    = 300;
  const H    = 60;
  const barW = Math.max(1, Math.floor((W - data.length) / data.length));

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} className="block">
        {data.map((d, i) => {
          const barH = Math.max(2, Math.round((d.views / max) * (H - 4)));
          return (
            <g key={d.date}>
              <rect
                x={i * (barW + 1)}
                y={H - barH}
                width={barW}
                height={barH}
                rx={1}
                className="fill-accent/60"
              />
              <title>{d.date}: {d.views} view{d.views !== 1 ? "s" : ""}</title>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] text-[#9A9A9A]">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

function DetailPanel({ listingId }: { listingId: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/listings/${listingId}`)
      .then((r) => r.json())
      .then((d) => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [listingId]);

  if (loading) return <p className="p-4 text-xs text-[#9A9A9A]">Loading…</p>;
  if (!detail) return <p className="p-4 text-xs text-[#9A9A9A]">Failed to load.</p>;

  const { dailyViews, offerFunnel } = detail;

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      {/* Sparkline */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A]">Daily views (30d)</p>
        <Sparkline data={dailyViews} />
      </div>
      {/* Offer funnel */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A]">Offer funnel</p>
        {offerFunnel.total === 0 ? (
          <p className="text-xs text-[#9A9A9A]">No offers yet.</p>
        ) : (
          <div className="space-y-1 text-xs">
            {[
              { label: "Total",     value: offerFunnel.total,     color: "text-[#F2F2F2]" },
              { label: "Accepted",  value: offerFunnel.accepted,  color: "text-bid" },
              { label: "Pending",   value: offerFunnel.pending,   color: "text-yellow-400" },
              { label: "Countered", value: offerFunnel.countered, color: "text-accent" },
              { label: "Declined",  value: offerFunnel.declined,  color: "text-[#9A9A9A]" },
              { label: "Expired",   value: offerFunnel.expired,   color: "text-[#9A9A9A]" },
            ].map(({ label, value, color }) => value > 0 && (
              <div key={label} className="flex items-center gap-2">
                <span className="w-20 text-[#9A9A9A]">{label}</span>
                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-surface2">
                  <div
                    className="h-full rounded-full bg-current transition-all"
                    style={{ width: `${Math.round((value / offerFunnel.total) * 100)}%`, color: "var(--tw-text-opacity)" }}
                  />
                </div>
                <span className={`w-6 text-right font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const [rows, setRows]       = useState<ListingRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res  = await fetch("/api/analytics/listings");
    const data = await res.json();
    if (res.ok) {
      setRows(data.listings ?? []);
      setSummary(data.summary ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-[#9A9A9A]">
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Active Listings",  value: summary.activeListings,  icon: RectangleStackIcon, color: "text-accent" },
            { label: "Views This Month", value: summary.viewsThisMonth,  icon: EyeIcon,             color: "text-sky-400" },
            { label: "Offers Received",  value: summary.offersReceived,  icon: TagIcon,             color: "text-yellow-400" },
            { label: "Deals Closed",     value: summary.dealsClosed,     icon: CheckCircleIcon,     color: "text-bid" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-surface p-5">
              <div className="flex items-center gap-2">
                <Icon className={`size-4 ${color}`} />
                <p className="text-xs font-medium uppercase tracking-widest text-[#9A9A9A]">{label}</p>
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F2F2F2]">
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Listings table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
        <div className="border-b border-white/10 px-5 py-3">
          <p className="text-sm font-semibold text-[#F2F2F2]">Listings Performance</p>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[#9A9A9A]">
            No listings yet.{" "}
            <a href="/listings/new" className="text-accent hover:underline">Create your first listing →</a>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* Header */}
            <div className="grid grid-cols-[1fr_60px_60px_80px_90px_20px] gap-3 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#9A9A9A]">
              <span>Card</span>
              <span className="text-right">Views</span>
              <span className="text-right">Offers</span>
              <span>Status</span>
              <span>Listed</span>
              <span />
            </div>

            {rows.map((row) => (
              <div key={row.id}>
                <button
                  onClick={() => setExpanded((prev) => (prev === row.id ? null : row.id))}
                  className="grid w-full grid-cols-[1fr_60px_60px_80px_90px_20px] items-center gap-3 px-5 py-3 text-left transition hover:bg-surface2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {row.imageUrl && (
                      <img src={row.imageUrl} alt="" className="h-8 w-6 shrink-0 rounded object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#F2F2F2]">{row.cardName}</p>
                      <p className="text-[10px] text-[#9A9A9A]">{phpFmt(row.price)}</p>
                    </div>
                  </div>
                  <span className="text-right text-xs font-semibold text-[#F2F2F2]">{row.views}</span>
                  <span className="text-right text-xs text-[#9A9A9A]">{row.offerCount}</span>
                  <span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_CHIP[row.status] ?? "bg-white/5 text-[#9A9A9A]"}`}>
                      {row.status.replace("_", " ")}
                    </span>
                  </span>
                  <span className="text-[10px] text-[#9A9A9A]">
                    {new Date(row.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </span>
                  {expanded === row.id
                    ? <ChevronDownIcon  className="size-4 text-[#9A9A9A]" />
                    : <ChevronRightIcon className="size-4 text-[#9A9A9A]" />
                  }
                </button>

                {expanded === row.id && (
                  <div className="border-t border-white/5 bg-surface2">
                    <DetailPanel listingId={row.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
