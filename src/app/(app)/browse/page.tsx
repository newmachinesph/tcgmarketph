"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "sonner";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusCircleIcon,
  BookmarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  collectionEntrySchema,
  CONDITIONS,
  CONDITION_LABEL,
  CONDITION_SHORT,
  type CollectionEntryInput,
} from "@/lib/validations/collection";
import {
  wishlistEntrySchema,
  PRIORITIES,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  type WishlistEntryInput,
} from "@/lib/validations/wishlist";
import type { CardCatalog } from "@/db/schema/cards";
import { CardImage } from "@/components/CardImage";

// ── Types ─────────────────────────────────────────────────────────────────────

type GameFilter = "all" | "pokemon" | "one_piece";

interface SearchResult {
  cards: CardCatalog[];
  fromCache: boolean;
  apiUnavailable: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GAME_LABEL: Record<string, string> = {
  pokemon:   "Pokémon",
  one_piece: "One Piece",
};

const CONDITION_COLOR: Record<(typeof CONDITIONS)[number], string> = {
  near_mint:         "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20",
  lightly_played:    "text-sky-400 bg-sky-400/10 ring-sky-400/20",
  moderately_played: "text-yellow-400 bg-yellow-400/10 ring-yellow-400/20",
  heavily_played:    "text-orange-400 bg-orange-400/10 ring-orange-400/20",
  damaged:           "text-rose-400 bg-rose-400/10 ring-rose-400/20",
};

const RARITY_COLOR: Record<string, string> = {
  "Common":              "text-slate-400  bg-slate-400/10",
  "Uncommon":            "text-green-400  bg-green-400/10",
  "Rare":                "text-sky-400    bg-sky-400/10",
  "Rare Holo":           "text-blue-400   bg-blue-400/10",
  "Rare Ultra":          "text-violet-400 bg-violet-400/10",
  "Special Illustration Rare": "text-pink-400 bg-pink-400/10",
  "Hyper Rare":          "text-yellow-400 bg-yellow-400/10",
  "Secret Rare":         "text-amber-400  bg-amber-400/10",
  "Leader":              "text-red-400    bg-red-400/10",
  "Super Rare":          "text-purple-400 bg-purple-400/10",
};

function rarityColor(rarity: string | null): string {
  if (!rarity) return "text-[#9A9A9A] bg-white/5";
  return RARITY_COLOR[rarity] ?? "text-[#9A9A9A] bg-white/5";
}

function fmt(n: string | null | undefined) {
  if (n == null) return null;
  const v = parseFloat(n);
  return isNaN(v) ? null : `$${v.toFixed(2)}`;
}

// ── Card image ────────────────────────────────────────────────────────────────

// ── Collection dialog ─────────────────────────────────────────────────────────

function AddToCollectionDialog({
  card,
  onClose,
}: {
  card: CardCatalog | null;
  onClose: () => void;
}) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<CollectionEntryInput>({
      resolver: zodResolver(collectionEntrySchema) as Resolver<CollectionEntryInput>,
      defaultValues: {
        cardId: card?.id ?? "",
        quantity: 1,
        isGraded: false,
        condition: "near_mint",
        gradingCompany: "none",
        isFoil: false,
        isFirstEdition: false,
        language: "en",
        isFavorite: false,
      },
    });

  useEffect(() => {
    if (card) reset({ cardId: card.id, quantity: 1, isGraded: false, condition: "near_mint", gradingCompany: "none", isFoil: false, isFirstEdition: false, language: "en", isFavorite: false });
  }, [card, reset]);

  const isGraded = watch("isGraded");

  async function onSubmit(data: CollectionEntryInput) {
    const res = await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error("Failed to add to collection"); return; }
    toast.success(`${card!.name} added to collection`);
    onClose();
  }

  if (!card) return null;

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#F2F2F2]">Add to Collection</DialogTitle>
            <button onClick={onClose} className="text-[#9A9A9A] hover:text-[#F2F2F2] transition"><XMarkIcon className="size-5" /></button>
          </div>

          {/* Card preview */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/8 bg-surface2 p-3">
            <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md">
              <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F2F2F2]">{card.name}</p>
              <p className="truncate text-xs text-[#9A9A9A]">{card.setName ?? GAME_LABEL[card.game]}{card.cardNumber ? ` · ${card.cardNumber}` : ""}</p>
              {card.marketPrice && <p className="text-[10px] text-[#9A9A9A]">Market: {fmt(card.marketPrice)} USD</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Quantity */}
            <div className="flex items-center gap-3">
              <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Quantity</label>
              <input {...register("quantity")} type="number" min={1} max={999}
                className="w-24 rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none" />
              {errors.quantity && <p className="text-xs text-rose-400">{errors.quantity.message}</p>}
            </div>

            {/* Raw / Graded toggle */}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setValue("isGraded", false); setValue("gradingCompany", "none"); }}
                className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${!isGraded ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>Raw</button>
              <button type="button" onClick={() => setValue("isGraded", true)}
                className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${isGraded ? "border-purple-400 bg-purple-400/10 text-purple-400" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>Graded</button>
            </div>

            {/* Condition (raw) */}
            {!isGraded && (
              <div>
                <p className="mb-1.5 text-xs text-[#9A9A9A]">Condition</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {CONDITIONS.map((c) => {
                    const active = watch("condition") === c;
                    return (
                      <button key={c} type="button" onClick={() => setValue("condition", c)} title={CONDITION_LABEL[c]}
                        className={`rounded-lg border py-2 text-[10px] font-bold uppercase transition ${active ? `${CONDITION_COLOR[c]} ring-1` : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
                        {CONDITION_SHORT[c]}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-right text-[10px] text-[#9A9A9A]">{CONDITION_LABEL[watch("condition")]}</p>
              </div>
            )}

            {/* Grading fields */}
            {isGraded && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Company</label>
                  <div className="flex gap-2">
                    {(["psa", "bgs", "cgc"] as const).map((co) => (
                      <button key={co} type="button" onClick={() => setValue("gradingCompany", co)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase transition ${watch("gradingCompany") === co ? "border-purple-400 bg-purple-400/10 text-purple-400" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
                        {co.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Grade</label>
                  <input {...register("gradeValue")} type="number" min={1} max={10} step={0.5} placeholder="e.g. 9.5"
                    className="w-24 rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none" />
                  {errors.gradeValue && <p className="text-xs text-rose-400">{errors.gradeValue.message}</p>}
                </div>
              </div>
            )}

            {/* Foil + 1st Ed */}
            <div className="flex gap-4">
              {([["isFoil", "Foil"], ["isFirstEdition", "1st Edition"]] as const).map(([field, label]) => (
                <label key={field} className="flex cursor-pointer items-center gap-2 text-xs text-[#9A9A9A]">
                  <input {...register(field)} type="checkbox" className="size-4 rounded border-white/20 bg-surface2 accent-accent" />
                  {label}
                </label>
              ))}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50">
              {isSubmitting ? "Adding…" : "Add to Collection"}
            </button>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Wishlist dialog ───────────────────────────────────────────────────────────

function AddToWishlistDialog({
  card,
  onClose,
}: {
  card: CardCatalog | null;
  onClose: () => void;
}) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<WishlistEntryInput>({
      resolver: zodResolver(wishlistEntrySchema) as Resolver<WishlistEntryInput>,
      defaultValues: { cardId: card?.id ?? "", priority: "medium" },
    });

  useEffect(() => {
    if (card) reset({ cardId: card.id, priority: "medium" });
  }, [card, reset]);

  async function onSubmit(data: WishlistEntryInput) {
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.status === 409) { toast.error("Already on your wishlist"); return; }
    if (!res.ok) { toast.error("Failed to add to wishlist"); return; }
    toast.success(`${card!.name} added to wishlist`);
    onClose();
  }

  if (!card) return null;

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#F2F2F2]">Add to Wishlist</DialogTitle>
            <button onClick={onClose} className="text-[#9A9A9A] hover:text-[#F2F2F2] transition"><XMarkIcon className="size-5" /></button>
          </div>

          {/* Card preview */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/8 bg-surface2 p-3">
            <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md">
              <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#F2F2F2]">{card.name}</p>
              <p className="truncate text-xs text-[#9A9A9A]">{card.setName ?? GAME_LABEL[card.game]}{card.cardNumber ? ` · ${card.cardNumber}` : ""}</p>
              {card.marketPrice && <p className="text-[10px] text-[#9A9A9A]">Market: {fmt(card.marketPrice)} USD</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Priority */}
            <div>
              <p className="mb-1.5 text-xs text-[#9A9A9A]">Priority</p>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button key={p} type="button" onClick={() => setValue("priority", p)}
                    className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${watch("priority") === p ? `${PRIORITY_COLOR[p]} ring-1` : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
                    {PRIORITY_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Max buy price */}
            <div className="flex items-center gap-3">
              <label className="w-28 shrink-0 text-xs text-[#9A9A9A]">Max Price (PHP)</label>
              <input {...register("maxBuyPrice")} type="number" min={0} step={0.01} placeholder="optional"
                className="w-36 rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none" />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-xs text-[#9A9A9A]">Notes (optional)</label>
              <textarea {...register("notes")} rows={2} placeholder="e.g. looking for NM or better"
                className="w-full resize-none rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none" />
              {errors.notes && <p className="mt-1 text-xs text-rose-400">{errors.notes.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50">
              {isSubmitting ? "Adding…" : "Add to Wishlist"}
            </button>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Card tile in results grid ─────────────────────────────────────────────────

function CardTile({
  card,
  onAddCollection,
  onAddWishlist,
}: {
  card: CardCatalog;
  onAddCollection: () => void;
  onAddWishlist: () => void;
}) {
  const price = fmt(card.marketPrice);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-surface transition hover:border-white/16">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-surface2">
        <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />

        {/* Rarity badge */}
        {card.rarity && (
          <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold ${rarityColor(card.rarity)}`}>
            {card.rarity}
          </span>
        )}

        {/* Game badge */}
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-medium text-white/80">
          {GAME_LABEL[card.game] ?? card.game}
        </span>

        {/* Action buttons on hover */}
        <div className="absolute inset-x-0 bottom-0 flex gap-1.5 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onAddCollection}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-accent/90 py-1.5 text-[10px] font-semibold text-white transition hover:bg-accent">
            <PlusCircleIcon className="size-3.5" />
            Collection
          </button>
          <button onClick={onAddWishlist}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white/10 py-1.5 text-[10px] font-semibold text-white transition hover:bg-white/20">
            <BookmarkIcon className="size-3.5" />
            Wishlist
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <p className="truncate text-sm font-semibold text-[#F2F2F2]">{card.name}</p>
        <p className="truncate text-xs text-[#9A9A9A]">
          {card.setName ?? GAME_LABEL[card.game]}
          {card.cardNumber ? ` · ${card.cardNumber}` : ""}
        </p>
        <p className="mt-0.5 text-xs font-semibold text-[#F2F2F2]">
          {price ? `${price} USD` : <span className="text-[#9A9A9A] font-normal">No price</span>}
        </p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [query, setQuery]           = useState("");
  const [game, setGame]             = useState<GameFilter>("all");
  const [rarityFilter, setRarity]   = useState<string>("all");
  const [setFilter, setSetFilter]   = useState<string>("all");
  const [result, setResult]         = useState<SearchResult | null>(null);
  const [searching, setSearching]   = useState(false);
  const [collCard, setCollCard]     = useState<CardCatalog | null>(null);
  const [wishCard, setWishCard]     = useState<CardCatalog | null>(null);
  const debounce                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search whenever query or game changes
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);

    if (query.trim().length < 2) {
      setResult(null);
      setRarity("all");
      setSetFilter("all");
      return;
    }

    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (game !== "all") params.set("game", game);
        const res  = await fetch(`/api/cards/search?${params}`);
        const json = await res.json();
        setResult(json);
        // Reset secondary filters when new search runs
        setRarity("all");
        setSetFilter("all");
      } catch {
        setResult({ cards: [], fromCache: true, apiUnavailable: true });
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, game]);

  // Derive available filter options from current results
  const allCards = result?.cards ?? [];

  const rarities = ["all", ...Array.from(
    new Set(allCards.map((c) => c.rarity).filter(Boolean) as string[])
  ).sort()];

  const sets = ["all", ...Array.from(
    new Set(allCards.map((c) => c.setName).filter(Boolean) as string[])
  ).sort()];

  // Apply client-side rarity + set filters
  const visible = allCards.filter((c) => {
    if (rarityFilter !== "all" && c.rarity !== rarityFilter) return false;
    if (setFilter   !== "all" && c.setName !== setFilter)   return false;
    return true;
  });

  const hasFilters = rarityFilter !== "all" || setFilter !== "all";

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 lg:px-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">Browse Cards</h1>
        <p className="mt-1 text-sm text-[#9A9A9A]">
          Search across Pokémon and One Piece. Results pull from local DB first, then tcgapi.dev.
        </p>
      </div>

      {/* Search + game filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-[#9A9A9A]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards by name…"
            autoFocus
            className="w-full rounded-xl border border-white/10 bg-surface py-3 pl-10 pr-10 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResult(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              <XMarkIcon className="size-4" />
            </button>
          )}
        </div>

        {/* Game tabs */}
        <div className="flex shrink-0 gap-1 rounded-xl bg-surface p-1 border border-white/8">
          {([["all", "All"], ["pokemon", "Pokémon"], ["one_piece", "One Piece"]] as const).map(([g, label]) => (
            <button key={g} onClick={() => setGame(g)}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition ${game === g ? "bg-surface2 text-[#F2F2F2] shadow" : "text-[#9A9A9A] hover:text-[#F2F2F2]"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary filters — only show when we have results with variety */}
      {allCards.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {/* Rarity pills */}
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

          {/* Set dropdown */}
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

          {/* Clear secondary filters */}
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
              <ArrowPathIcon className="size-3" />
              API unavailable
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
      {!searching && query.length < 2 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <MagnifyingGlassIcon className="mb-3 size-10 text-white/20" />
          <p className="text-[#F2F2F2] font-medium">Start searching</p>
          <p className="mt-1 text-sm text-[#9A9A9A]">Type at least 2 characters to search cards</p>
        </div>
      )}

      {!searching && result && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-[#F2F2F2] font-medium">No results</p>
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
              key={card.id}
              card={card}
              onAddCollection={() => setCollCard(card)}
              onAddWishlist={() => setWishCard(card)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddToCollectionDialog card={collCard} onClose={() => setCollCard(null)} />
      <AddToWishlistDialog   card={wishCard} onClose={() => setWishCard(null)} />
    </div>
  );
}
