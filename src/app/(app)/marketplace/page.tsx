"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  StarIcon,
  ShieldCheckIcon,
  MapPinIcon,
  PhotoIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { CONDITION_LABEL } from "@/lib/validations/listing";

// ── Types ────────────────────────────────────────────────────────────────────

type Game = "pokemon" | "one_piece" | "";
type Sort = "newest" | "price_asc" | "price_desc";
type GradedFilter = "" | "true" | "false";

interface MarketListing {
  id:            string;
  price:         string;
  condition:     string;
  isGraded:      boolean;
  gradingCompany: string;
  gradeValue:    string | null;
  isFoil:        boolean;
  isFirstEdition: boolean;
  quantity:      number;
  status:        string;
  createdAt:     string;
  coverPhoto:    string | null;
  card: {
    name:        string;
    setName:     string | null;
    game:        "pokemon" | "one_piece";
    imageUrl:    string | null;
    marketPrice: string | null;
  };
  seller: {
    id:              string;
    name:            string;
    displayName:     string | null;
    image:           string | null;
    city:            string | null;
    phoneVerified:   boolean;
    reputationScore: number;
  };
}

// ── Constants ────────────────────────────────────────────────────────────────

const GAME_OPTIONS: { value: Game; label: string }[] = [
  { value: "",          label: "All" },
  { value: "pokemon",   label: "Pokémon" },
  { value: "one_piece", label: "One Piece" },
];

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: "newest",     label: "Newest first" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

const CONDITION_OPTIONS = [
  { value: "",                   label: "Any condition" },
  { value: "near_mint",          label: "Near Mint" },
  { value: "lightly_played",     label: "Lightly Played" },
  { value: "moderately_played",  label: "Moderately Played" },
  { value: "heavily_played",     label: "Heavily Played" },
  { value: "damaged",            label: "Damaged" },
];

const GRADED_OPTIONS: { value: GradedFilter; label: string }[] = [
  { value: "",      label: "All" },
  { value: "true",  label: "Graded" },
  { value: "false", label: "Raw" },
];

const GAME_BADGE: Record<string, string> = {
  pokemon:   "bg-yellow-500/20 text-yellow-300",
  one_piece: "bg-red-500/20 text-red-300",
};

const GAME_LABEL: Record<string, string> = {
  pokemon:   "Pokémon",
  one_piece: "One Piece",
};

// ── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: MarketListing }) {
  const sellerName = listing.seller.displayName ?? listing.seller.name;
  const conditionLabel = listing.isGraded
    ? `${listing.gradingCompany.toUpperCase()} ${listing.gradeValue}`
    : (CONDITION_LABEL[listing.condition] ?? listing.condition);

  const tags: string[] = [];
  if (listing.isFoil)         tags.push("Foil");
  if (listing.isFirstEdition) tags.push("1st Ed.");

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface transition hover:border-white/20 hover:shadow-lg"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface2">
        {listing.coverPhoto ? (
          <img
            src={listing.coverPhoto}
            alt={listing.card.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : listing.card.imageUrl ? (
          <img
            src={listing.card.imageUrl}
            alt={listing.card.name}
            className="h-full w-full object-contain p-3 transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <PhotoIcon className="size-12 text-white/10" />
          </div>
        )}

        {/* Game badge */}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            GAME_BADGE[listing.card.game] ?? "bg-white/10 text-white/70"
          }`}
        >
          {GAME_LABEL[listing.card.game] ?? listing.card.game}
        </span>

        {/* Quantity badge when > 1 */}
        {listing.quantity > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
            ×{listing.quantity}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-[#F2F2F2]">
          {listing.card.name}
        </p>
        <p className="text-[11px] text-[#9A9A9A]">
          {listing.card.setName ?? "Unknown set"}
        </p>

        {/* Condition + tags */}
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-[#9A9A9A]">
            {conditionLabel}
          </span>
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Price */}
        <p className="mt-1 text-base font-bold text-[#F2F2F2]">
          ₱{parseFloat(listing.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </p>

        {/* Seller */}
        <div className="mt-auto flex items-center gap-1.5 pt-2">
          {listing.seller.image ? (
            <img
              src={listing.seller.image}
              alt={sellerName}
              className="size-5 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface2 text-[9px] font-bold text-[#9A9A9A]">
              {sellerName.charAt(0).toUpperCase()}
            </div>
          )}
          <span
            className="min-w-0 truncate text-[11px] text-[#9A9A9A] hover:text-accent hover:underline cursor-pointer"
            onClick={(e) => { e.preventDefault(); window.location.href = `/sellers/${listing.seller.id}`; }}
          >{sellerName}</span>
          <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[10px] text-[#9A9A9A]">
            <StarIcon className="size-3" />
            {listing.seller.reputationScore}
          </span>
          {listing.seller.phoneVerified && (
            <ShieldCheckIcon className="size-3.5 shrink-0 text-emerald-400" />
          )}
        </div>
        {listing.seller.city && (
          <p className="flex items-center gap-0.5 text-[10px] text-[#9A9A9A]">
            <MapPinIcon className="size-3" />
            {listing.seller.city}
          </p>
        )}
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [results, setResults]       = useState<MarketListing[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]       = useState(false);
  const [page, setPage]             = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [q, setQ]               = useState("");
  const [game, setGame]         = useState<Game>("");
  const [condition, setCondition] = useState("");
  const [isGraded, setIsGraded] = useState<GradedFilter>("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort]         = useState<Sort>("newest");

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const buildParams = useCallback(
    (pg: number) => {
      const p = new URLSearchParams();
      if (q)        p.set("q", q);
      if (game)     p.set("game", game);
      if (condition) p.set("condition", condition);
      if (isGraded) p.set("isGraded", isGraded);
      if (minPrice) p.set("minPrice", minPrice);
      if (maxPrice) p.set("maxPrice", maxPrice);
      p.set("sort", sort);
      p.set("page", String(pg));
      return p.toString();
    },
    [q, game, condition, isGraded, minPrice, maxPrice, sort]
  );

  const fetchListings = useCallback(
    async (pg: number, append: boolean) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const res  = await fetch(`/api/marketplace?${buildParams(pg)}`);
        const data = await res.json();
        if (!res.ok) return;

        setResults((prev) => (append ? [...prev, ...data.listings] : data.listings));
        setPage(pg);
        setHasMore(data.hasMore);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildParams]
  );

  // Re-fetch (page 1) whenever filters change — debounce the text search
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      fetchListings(1, false);
    }, q ? 350 : 0);

    return () => {
      if (searchRef.current) clearTimeout(searchRef.current);
    };
  }, [q, game, condition, isGraded, minPrice, maxPrice, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadMore() {
    fetchListings(page + 1, true);
  }

  function clearFilters() {
    setQ("");
    setGame("");
    setCondition("");
    setIsGraded("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
  }

  const hasActiveFilters = q || game || condition || isGraded || minPrice || maxPrice || sort !== "newest";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-8 lg:px-10">

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F2F2F2]">Marketplace</h1>
          <p className="mt-0.5 text-sm text-[#9A9A9A]">Browse cards for sale — cash on meetup</p>
        </div>
        <Link
          href="/listings/new"
          className="shrink-0 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/80"
        >
          Sell a card
        </Link>
      </div>

      {/* Search + sort + filter toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9A9A]" />
          <input
            type="text"
            placeholder="Search cards…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-surface py-2 pl-9 pr-3 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-xl border border-white/10 bg-surface py-2 pl-3 pr-8 text-sm text-[#F2F2F2] focus:border-white/20 focus:outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition ${
            showFilters || hasActiveFilters
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-white/10 bg-surface text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]"
          }`}
        >
          <AdjustmentsHorizontalIcon className="size-4" />
          Filters
          {hasActiveFilters && (
            <span className="flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
              !
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-[#9A9A9A] hover:text-[#F2F2F2]"
          >
            <XMarkIcon className="size-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-surface p-4">
          <div className="flex flex-wrap gap-6">

            {/* Game */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Game</p>
              <div className="flex gap-1">
                {GAME_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setGame(o.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      game === o.value
                        ? "bg-accent text-white"
                        : "bg-surface2 text-[#9A9A9A] hover:text-[#F2F2F2]"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Condition</p>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="rounded-lg border border-white/10 bg-surface2 py-1.5 pl-2.5 pr-7 text-xs text-[#F2F2F2] focus:border-white/20 focus:outline-none"
              >
                {CONDITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Graded */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Type</p>
              <div className="flex gap-1">
                {GRADED_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setIsGraded(o.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      isGraded === o.value
                        ? "bg-accent text-white"
                        : "bg-surface2 text-[#9A9A9A] hover:text-[#F2F2F2]"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A9A9A]">Price (₱)</p>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-24 rounded-lg border border-white/10 bg-surface2 py-1.5 pl-2.5 pr-2 text-xs text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
                />
                <span className="text-xs text-[#9A9A9A]">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-24 rounded-lg border border-white/10 bg-surface2 py-1.5 pl-2.5 pr-2 text-xs text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Game quick-filter chips (always visible) */}
      <div className="mb-4 flex items-center gap-2">
        {GAME_OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => setGame(o.value)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              game === o.value
                ? "bg-accent text-white"
                : "bg-surface border border-white/10 text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-2xl">🃏</p>
          <p className="font-semibold text-[#F2F2F2]">No listings found</p>
          <p className="text-sm text-[#9A9A9A]">
            {hasActiveFilters
              ? "Try adjusting or clearing your filters."
              : "Be the first to list a card!"}
          </p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-1 text-sm text-accent hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-[#9A9A9A]">
            {results.length} listing{results.length !== 1 ? "s" : ""}
            {hasMore ? "+" : ""} shown
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-xl border border-white/10 bg-surface px-6 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-50"
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
