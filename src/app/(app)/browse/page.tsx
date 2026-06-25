"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "sonner";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusCircleIcon,
  BookmarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { CONDITION_COLOR, type CollectionEntryInput } from "@/lib/validations/collection";
import { type WishlistEntryInput } from "@/lib/validations/wishlist";
import { GAME_LABEL } from "@/lib/constants/games";
import type { CardCatalog } from "@/db/schema/cards";
import { CardImage } from "@/components/CardImage";
import { Price } from "@/components/Price";
import { CollectionEntryForm } from "@/components/CollectionEntryForm";
import { WishlistEntryForm } from "@/components/WishlistEntryForm";

// ── Types ─────────────────────────────────────────────────────────────────────

type GameFilter = "all" | "pokemon" | "one_piece";

interface SearchResult {
  cards: CardCatalog[];
  fromCache: boolean;
  apiUnavailable: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RARITY_COLOR: Record<string, string> = {
  "Common":                    "text-slate-400  bg-slate-400/10",
  "Uncommon":                  "text-green-400  bg-green-400/10",
  "Rare":                      "text-sky-400    bg-sky-400/10",
  "Rare Holo":                 "text-blue-400   bg-blue-400/10",
  "Rare Ultra":                "text-violet-400 bg-violet-400/10",
  "Special Illustration Rare": "text-pink-400   bg-pink-400/10",
  "Hyper Rare":                "text-yellow-400 bg-yellow-400/10",
  "Secret Rare":               "text-amber-400  bg-amber-400/10",
  "Leader":                    "text-red-400    bg-red-400/10",
  "Super Rare":                "text-purple-400 bg-purple-400/10",
};

function rarityColor(rarity: string | null): string {
  if (!rarity) return "text-[#9A9A9A] bg-white/5";
  return RARITY_COLOR[rarity] ?? "text-[#9A9A9A] bg-white/5";
}

// ── Add to Collection dialog ──────────────────────────────────────────────────

function AddToCollectionDialog({ card, onClose }: { card: CardCatalog; onClose: () => void }) {
  async function onSubmit(data: CollectionEntryInput) {
    const res = await fetch("/api/collection", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Failed to add to collection"); return; }
    toast.success(`${card.name} added to collection`);
    onClose();
  }

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#F2F2F2]">Add to Collection</DialogTitle>
            <button onClick={onClose} aria-label="Close" className="text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              <XMarkIcon className="size-5" />
            </button>
          </div>
          <CollectionEntryForm card={card} onSubmit={onSubmit} submitLabel="Add to Collection" />
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Add to Wishlist dialog ────────────────────────────────────────────────────

function AddToWishlistDialog({ card, onClose }: { card: CardCatalog; onClose: () => void }) {
  async function onSubmit(data: WishlistEntryInput) {
    const res = await fetch("/api/wishlist", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (res.status === 409) { toast.error("Already on your wishlist"); return; }
    if (!res.ok) { toast.error("Failed to add to wishlist"); return; }
    toast.success(`${card.name} added to wishlist`);
    onClose();
  }

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#F2F2F2]">Add to Wishlist</DialogTitle>
            <button onClick={onClose} aria-label="Close" className="text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              <XMarkIcon className="size-5" />
            </button>
          </div>
          <WishlistEntryForm card={card} onSubmit={onSubmit} submitLabel="Add to Wishlist" />
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Card tile ─────────────────────────────────────────────────────────────────

function CardTile({ card, onAddCollection, onAddWishlist }: {
  card: CardCatalog; onAddCollection: () => void; onAddWishlist: () => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-surface transition hover:border-white/16">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface2">
        <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />

        {card.rarity && (
          <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${rarityColor(card.rarity)}`}>
            {card.rarity}
          </span>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-medium text-white/80">
          {GAME_LABEL[card.game] ?? card.game}
        </span>

        {/* Condition color dot if card has rarity that maps to CONDITION_COLOR — not used here */}

        <div className="absolute inset-x-0 bottom-0 flex gap-1.5 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onAddCollection} aria-label={`Add ${card.name} to collection`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-accent/90 py-1.5 text-[10px] font-semibold text-white transition hover:bg-accent">
            <PlusCircleIcon className="size-3.5" /> Collection
          </button>
          <button onClick={onAddWishlist} aria-label={`Add ${card.name} to wishlist`}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/10 py-1.5 text-[10px] font-semibold text-white transition hover:bg-white/20">
            <BookmarkIcon className="size-3.5" /> Wishlist
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 p-3">
        <p className="truncate text-sm font-semibold text-[#F2F2F2]">{card.name}</p>
        <p className="truncate text-xs text-[#9A9A9A]">
          {card.setName ?? GAME_LABEL[card.game]}{card.cardNumber ? ` · ${card.cardNumber}` : ""}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-[#F2F2F2]">
          {card.marketPrice
            ? <Price usd={card.marketPrice} />
            : <span className="font-normal text-[#9A9A9A]">No price</span>}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [query, setQuery]         = useState("");
  const [game, setGame]           = useState<GameFilter>("all");
  const [rarityFilter, setRarity] = useState<string>("all");
  const [setFilter, setSetFilter] = useState<string>("all");
  const [result, setResult]       = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [collCard, setCollCard]   = useState<CardCatalog | null>(null);
  const [wishCard, setWishCard]   = useState<CardCatalog | null>(null);
  // Track previous query+game so we only reset filters when they actually change
  const [lastSearch, setLastSearch] = useState<{ q: string; g: GameFilter } | null>(null);

  const runSearch = useCallback(async (q: string, g: GameFilter) => {
    if (q.trim().length < 2) return;
    setSearching(true);

    // Only reset filters when the search terms change
    if (!lastSearch || lastSearch.q !== q.trim() || lastSearch.g !== g) {
      setRarity("all");
      setSetFilter("all");
      setLastSearch({ q: q.trim(), g });
    }

    try {
      const params = new URLSearchParams({ q: q.trim() });
      if (g !== "all") params.set("game", g);
      setResult(await fetch(`/api/cards/search?${params}`).then((r) => r.json()));
    } catch {
      setResult({ cards: [], fromCache: true, apiUnavailable: true });
    } finally {
      setSearching(false);
    }
  }, [lastSearch]);

  const allCards = result?.cards ?? [];

  const rarities = ["all", ...Array.from(
    new Set(allCards.map((c) => c.rarity).filter(Boolean) as string[])
  ).sort()];

  const sets = ["all", ...Array.from(
    new Set(allCards.map((c) => c.setName).filter(Boolean) as string[])
  ).sort()];

  const visible = allCards.filter((c) => {
    if (rarityFilter !== "all" && c.rarity !== rarityFilter) return false;
    if (setFilter   !== "all" && c.setName !== setFilter)   return false;
    return true;
  });

  const hasFilters = rarityFilter !== "all" || setFilter !== "all";

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">Browse Cards</h1>
        <p className="mt-1 text-sm text-[#9A9A9A]">
          Search across Pokémon and One Piece. Results pull from local DB first, then tcgapi.dev.
        </p>
      </div>

      {/* Search + game filter */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#9A9A9A]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(query, game); }}
              placeholder="Search cards by name… then press Enter or Search"
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-surface py-3 pl-10 pr-10 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResult(null); setLastSearch(null); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#F2F2F2] transition"
              >
                <XMarkIcon className="size-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => runSearch(query, game)}
            disabled={query.trim().length < 2 || searching}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-40"
          >
            <MagnifyingGlassIcon className="size-4" />
            Search
          </button>
        </div>

        <div className="flex gap-1 rounded-xl bg-surface p-1 border border-white/8 self-start">
          {([["all", "All"], ["pokemon", "Pokémon"], ["one_piece", "One Piece"]] as const).map(([g, label]) => (
            <button key={g} onClick={() => setGame(g)}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition ${game === g ? "bg-surface2 text-[#F2F2F2] shadow" : "text-[#9A9A9A] hover:text-[#F2F2F2]"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary filters */}
      {allCards.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {rarities.length > 2 && (
            <div className="flex flex-wrap gap-1.5">
              {rarities.map((r) => (
                <button key={r} onClick={() => setRarity(r)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${rarityFilter === r ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
                  {r === "all" ? "All Rarities" : r}
                </button>
              ))}
            </div>
          )}

          {sets.length > 2 && (
            <select
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value)}
              className="rounded-full border border-white/10 bg-surface px-3 py-1 text-xs text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
            >
              {sets.map((s) => (
                <option key={s} value={s}>{s === "all" ? "All Sets" : s}</option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button onClick={() => { setRarity("all"); setSetFilter("all"); }}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Result meta */}
      {result && !searching && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm text-[#9A9A9A]">
            {visible.length} result{visible.length !== 1 ? "s" : ""}
            {hasFilters && allCards.length !== visible.length && ` (filtered from ${allCards.length})`}
          </p>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${result.fromCache ? "bg-surface2 text-[#9A9A9A]" : "bg-accent/10 text-accent"}`}>
            {result.fromCache ? "from database" : "from api"}
          </span>
          {result.apiUnavailable && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-yellow-400">
              <ArrowPathIcon className="size-3" /> API unavailable
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {searching && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-surface aspect-[3/4]" />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!searching && !result && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <MagnifyingGlassIcon className="mb-3 size-10 text-white/20" />
          <p className="font-medium text-[#F2F2F2]">Search for a card</p>
          <p className="mt-1 text-sm text-[#9A9A9A]">Type a name then press Enter or click Search</p>
        </div>
      )}

      {!searching && result && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-medium text-[#F2F2F2]">No results</p>
          <p className="mt-1 text-sm text-[#9A9A9A]">
            {hasFilters ? "Try clearing the filters" : "Try a different spelling or search term"}
          </p>
        </div>
      )}

      {/* Results grid */}
      {!searching && visible.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((card) => (
            <CardTile
              key={card.id} card={card}
              onAddCollection={() => setCollCard(card)}
              onAddWishlist={() => setWishCard(card)}
            />
          ))}
        </div>
      )}

      {collCard && <AddToCollectionDialog card={collCard} onClose={() => setCollCard(null)} />}
      {wishCard && <AddToWishlistDialog   card={wishCard} onClose={() => setWishCard(null)} />}
    </div>
  );
}
