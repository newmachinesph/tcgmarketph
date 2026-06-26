"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  ShieldCheckIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const GAMES = [
  { id: "",          label: "All games"  },
  { id: "pokemon",   label: "⚡ Pokémon"  },
  { id: "one_piece", label: "☠️ One Piece" },
];

interface SellerCard {
  id:               string;
  name:             string;
  displayName:      string | null;
  image:            string | null;
  city:             string | null;
  bio:              string | null;
  games:            string | null;
  kycStatus:        string;
  subscriptionTier: string;
  reputationScore:  number;
  avgScore:         string | null;
  ratingCount:      number;
  createdAt:        string;
}

function GameTags({ games }: { games: string | null }) {
  if (!games) return null;
  const labels: Record<string, string> = { pokemon: "⚡ Pokémon", one_piece: "☠️ One Piece" };
  return (
    <div className="flex flex-wrap gap-1">
      {games.split(",").map((g) => g.trim()).filter(Boolean).map((g) => (
        <span key={g} className="rounded bg-surface2 px-1.5 py-0.5 text-[9px] font-medium text-[#9A9A9A]">
          {labels[g] ?? g}
        </span>
      ))}
    </div>
  );
}

export default function SellersPage() {
  const [sellers, setSellers]   = useState<SellerCard[]>([]);
  const [loading, setLoading]   = useState(true);
  const [hasMore, setHasMore]   = useState(false);
  const [page, setPage]         = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const [q, setQ]       = useState("");
  const [city, setCity] = useState("");
  const [game, setGame] = useState("");
  const [sort, setSort] = useState<"deals" | "rating">("deals");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (
    search: string, cityFilter: string, gameFilter: string, sortBy: string, p: number, append: boolean,
  ) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams({ sort: sortBy, page: String(p) });
    if (search)     params.set("q",    search);
    if (cityFilter) params.set("city", cityFilter);
    if (gameFilter) params.set("game", gameFilter);

    const res  = await fetch(`/api/sellers?${params}`);
    const data = await res.json();
    if (res.ok) {
      setSellers((prev) => append ? [...prev, ...data.sellers] : data.sellers);
      setHasMore(data.hasMore);
      setPage(p);
    }
    setLoading(false);
    setLoadingMore(false);
  }, []);

  // Debounce text inputs; reset to page 1 on any filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load(q, city, game, sort, 1, false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, city, game, sort, load]);

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-8 lg:px-10 space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#F2F2F2]">Seller Directory</h1>
        <p className="text-sm text-[#9A9A9A]">Browse verified sellers by city, game, or reputation.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9A9A]" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name…"
            className="w-full rounded-xl border border-white/10 bg-surface py-2.5 pl-9 pr-4 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
        </div>

        {/* City */}
        <div className="relative min-w-[160px]">
          <MapPinIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9A9A]" />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Filter by city…"
            className="w-full rounded-xl border border-white/10 bg-surface py-2.5 pl-9 pr-4 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
        </div>

        {/* Game tabs */}
        <div className="flex rounded-lg border border-white/10 bg-surface overflow-hidden">
          {GAMES.map((g) => (
            <button
              key={g.id}
              onClick={() => setGame(g.id)}
              className={`px-3 py-2 text-xs font-medium transition whitespace-nowrap ${
                game === g.id ? "bg-accent text-white" : "text-[#9A9A9A] hover:text-[#F2F2F2]"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex rounded-lg border border-white/10 bg-surface overflow-hidden">
          {([["deals", "Most Deals"], ["rating", "Best Rated"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setSort(v)}
              className={`px-3 py-2 text-xs font-medium transition ${
                sort === v ? "bg-surface2 text-[#F2F2F2]" : "text-[#9A9A9A] hover:text-[#F2F2F2]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-16 text-center">
          <p className="text-sm text-[#9A9A9A]">No sellers found matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sellers.map((s) => {
              const displayName = s.displayName ?? s.name;
              return (
                <Link
                  key={s.id}
                  href={`/sellers/${s.id}`}
                  className="group rounded-2xl border border-white/10 bg-surface p-4 transition hover:border-white/20 hover:bg-surface2 space-y-3"
                >
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    {s.image ? (
                      <img
                        src={s.image}
                        alt={displayName}
                        className="size-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface2 text-base font-bold text-[#9A9A9A] group-hover:bg-surface">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="truncate text-sm font-semibold text-[#F2F2F2]">{displayName}</p>
                        {s.kycStatus === "verified" && (
                          <ShieldCheckIcon className="size-3.5 shrink-0 text-emerald-400" title="KYC Verified" />
                        )}
                        {s.subscriptionTier === "power_seller" && (
                          <span className="rounded bg-accent/20 px-1 py-0.5 text-[9px] font-bold text-accent">PRO</span>
                        )}
                      </div>
                      {s.city && (
                        <p className="flex items-center gap-0.5 text-[11px] text-[#9A9A9A] truncate">
                          <MapPinIcon className="size-3 shrink-0" />
                          {s.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Game tags */}
                  <GameTags games={s.games} />

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-[#9A9A9A]">
                    <span className="font-semibold text-[#F2F2F2]">{s.reputationScore} deals</span>
                    {s.avgScore ? (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <StarSolid className="size-3" />
                        {s.avgScore}
                        <span className="text-[#9A9A9A]">({s.ratingCount})</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <StarIcon className="size-3" />
                        No ratings
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                onClick={() => load(q, city, game, sort, page + 1, true)}
                disabled={loadingMore}
                className="rounded-xl border border-white/10 px-8 py-2.5 text-sm text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
