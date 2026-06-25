"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "sonner";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import {
  PRIORITIES,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  type WishlistEntryInput,
} from "@/lib/validations/wishlist";
import { type CollectionEntryInput } from "@/lib/validations/collection";
import { GAME_LABEL } from "@/lib/constants/games";
import type { CardCatalog, UserWishlist } from "@/db/schema/cards";
import { CardImage } from "@/components/CardImage";
import { Price } from "@/components/Price";
import { WishlistEntryForm } from "@/components/WishlistEntryForm";
import { CollectionEntryForm } from "@/components/CollectionEntryForm";

// ── Types ─────────────────────────────────────────────────────────────────────

type WishlistEntry = { entry: UserWishlist; card: CardCatalog };
type GameFilter    = "pokemon" | "one_piece" | "all";

// ── Add to Wishlist dialog ────────────────────────────────────────────────────

function AddWishlistDialog({ open, onClose, onAdded }: {
  open: boolean; onClose: () => void; onAdded: () => void;
}) {
  const [step, setStep]           = useState<"search" | "configure">("search");
  const [game, setGame]           = useState<GameFilter>("all");
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<CardCatalog[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<CardCatalog | null>(null);
  const debounceRef               = useState<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => { setStep("search"); setQuery(""); setResults([]); setSelected(null); };

  function handleSearch(q: string, g: GameFilter) {
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    if (q.trim().length < 2) { setResults([]); return; }
    debounceRef[1](setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q });
        if (g !== "all") params.set("game", g);
        setResults((await fetch(`/api/cards/search?${params}`).then((r) => r.json())).cards ?? []);
      } catch { setResults([]); }
      finally  { setSearching(false); }
    }, 400));
  }

  async function handleAdd(data: WishlistEntryInput) {
    const res = await fetch("/api/wishlist", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (res.status === 409) { toast.error("Already on your wishlist"); return; }
    if (!res.ok) throw new Error("Failed to add");
    toast.success(`${selected!.name} added to wishlist`);
    onAdded(); onClose(); reset();
  }

  return (
    <Dialog open={open} onClose={() => { onClose(); reset(); }} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#F2F2F2]">
              {step === "search" ? "Add to Wishlist" : "Wishlist Details"}
            </DialogTitle>
            <button onClick={() => { onClose(); reset(); }} aria-label="Close" className="text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              <XMarkIcon className="size-5" />
            </button>
          </div>

          {step === "search" ? (
            <div className="space-y-4">
              <div className="flex gap-1.5 rounded-xl bg-surface2 p-1">
                {([["all", "All"], ["pokemon", "Pokémon"], ["one_piece", "One Piece"]] as const).map(([g, label]) => (
                  <button key={g} onClick={() => { setGame(g); handleSearch(query, g); }}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${game === g ? "bg-surface text-[#F2F2F2] shadow" : "text-[#9A9A9A] hover:text-[#F2F2F2]"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9A9A]" />
                <input
                  value={query} onChange={(e) => { setQuery(e.target.value); handleSearch(e.target.value, game); }}
                  placeholder="Search cards…" autoFocus
                  className="w-full rounded-xl border border-white/10 bg-surface2 py-2.5 pl-9 pr-4 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
                />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {searching && <p className="py-6 text-center text-xs text-[#9A9A9A]">Searching…</p>}
                {!searching && query.length >= 2 && results.length === 0 && (
                  <p className="py-6 text-center text-xs text-[#9A9A9A]">No cards found.</p>
                )}
                {results.map((card) => (
                  <button key={card.id} onClick={() => { setSelected(card); setStep("configure"); }}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-white/10 hover:bg-surface2">
                    <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md">
                      <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#F2F2F2]">{card.name}</p>
                      <p className="truncate text-xs text-[#9A9A9A]">
                        {card.setName ?? GAME_LABEL[card.game]}{card.cardNumber ? ` · ${card.cardNumber}` : ""}
                      </p>
                    </div>
                    {card.marketPrice && <Price usd={card.marketPrice} className="shrink-0 text-xs text-[#9A9A9A]" />}
                  </button>
                ))}
              </div>
            </div>
          ) : selected && (
            <WishlistEntryForm
              card={selected} onSubmit={handleAdd}
              submitLabel="Add to Wishlist" onBack={() => setStep("search")}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Edit dialog ───────────────────────────────────────────────────────────────

function EditDialog({ item, onClose, onSaved }: {
  item: WishlistEntry | null; onClose: () => void; onSaved: () => void;
}) {
  if (!item) return null;

  async function handleSave(data: WishlistEntryInput) {
    const res = await fetch(`/api/wishlist/${item!.entry.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save");
    toast.success("Wishlist entry updated"); onSaved(); onClose();
  }

  const e = item.entry;
  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#F2F2F2]">Edit Wishlist Entry</DialogTitle>
            <button onClick={onClose} aria-label="Close" className="text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              <XMarkIcon className="size-5" />
            </button>
          </div>
          <WishlistEntryForm
            card={item.card} onSubmit={handleSave} submitLabel="Save Changes"
            defaultValues={{
              cardId:      e.cardId,
              priority:    e.priority,
              maxBuyPrice: e.maxBuyPrice != null ? parseFloat(e.maxBuyPrice) : undefined,
              notes:       e.notes ?? undefined,
            }}
          />
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Acquire dialog — add to collection and remove from wishlist ───────────────

function AcquireDialog({ item, onClose, onAcquired }: {
  item: WishlistEntry; onClose: () => void; onAcquired: () => void;
}) {
  async function handleAcquire(data: CollectionEntryInput) {
    // Add to collection first
    const addRes = await fetch("/api/collection", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!addRes.ok) throw new Error("Failed to add to collection");

    // Then remove from wishlist
    await fetch(`/api/wishlist/${item.entry.id}`, { method: "DELETE" });

    toast.success(`${item.card.name} moved to collection!`);
    onAcquired();
    onClose();
  }

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-[#F2F2F2]">Mark as Acquired</DialogTitle>
              <p className="mt-0.5 text-xs text-[#9A9A9A]">This will add it to your collection and remove it from your wishlist.</p>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              <XMarkIcon className="size-5" />
            </button>
          </div>
          <CollectionEntryForm
            card={item.card}
            onSubmit={handleAcquire}
            submitLabel="Add to Collection"
            defaultValues={{ cardId: item.card.id }}
          />
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Wishlist row ──────────────────────────────────────────────────────────────

function WishlistRow({
  entry, card, onEdit, onDelete, onAcquire,
}: {
  entry: UserWishlist; card: CardCatalog;
  onEdit: () => void; onDelete: () => void; onAcquire: () => void;
}) {
  const marketPrice = card.marketPrice ? parseFloat(card.marketPrice) : null;
  const maxBuy      = entry.maxBuyPrice ? parseFloat(entry.maxBuyPrice) : null;
  const underBudget = marketPrice != null && maxBuy != null && marketPrice <= maxBuy;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-surface px-4 py-3 transition hover:border-white/14">
      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg">
        <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="truncate text-sm font-semibold text-[#F2F2F2]">{card.name}</p>
          <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${PRIORITY_COLOR[entry.priority]}`}>
            {PRIORITY_LABEL[entry.priority]}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-[#9A9A9A]">
          {card.setName ?? GAME_LABEL[card.game]}{card.cardNumber ? ` · ${card.cardNumber}` : ""}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-[#9A9A9A]">
          {marketPrice != null && (
            <span>Market: <Price usd={card.marketPrice} className="text-[#F2F2F2]" /></span>
          )}
          {maxBuy != null && (
            <span>
              Budget: <span className={underBudget ? "font-semibold text-emerald-400" : "text-[#F2F2F2]"}>
                ₱{maxBuy.toFixed(2)}{underBudget && " ✓"}
              </span>
            </span>
          )}
        </div>
        {entry.notes && (
          <p className="mt-1 truncate text-xs italic text-[#9A9A9A]">{entry.notes}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button onClick={onAcquire} aria-label="Mark as acquired — move to collection"
          className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 transition hover:bg-emerald-500/20">
          <CheckIcon className="size-4" />
        </button>
        <button onClick={onEdit} aria-label="Edit wishlist entry"
          className="rounded-lg border border-white/10 p-2 text-[#9A9A9A] transition hover:text-[#F2F2F2]">
          <PencilSquareIcon className="size-4" />
        </button>
        <button onClick={onDelete} aria-label="Remove from wishlist"
          className="rounded-lg bg-rose-500/10 p-2 text-rose-400 transition hover:bg-rose-500/20">
          <TrashIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export default function WishlistPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen]         = useState(false);
  const [editItem, setEditItem]       = useState<WishlistEntry | null>(null);
  const [acquireItem, setAcquireItem] = useState<WishlistEntry | null>(null);

  const { data, isPending, isError } = useQuery<{ entries: WishlistEntry[] }>({
    queryKey: ["wishlist"],
    queryFn:  () => fetch("/api/wishlist").then((r) => r.json()),
    staleTime: 60_000,
  });

  const entries = (data?.entries ?? []).slice().sort(
    (a, b) => PRIORITY_ORDER[a.entry.priority] - PRIORITY_ORDER[b.entry.priority]
  );

  const refetch = () => {
    qc.invalidateQueries({ queryKey: ["wishlist"] });
    qc.invalidateQueries({ queryKey: ["collection"] });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/wishlist/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) throw new Error("Failed"); }),
    onSuccess: () => { toast.success("Removed from wishlist"); qc.invalidateQueries({ queryKey: ["wishlist"] }); },
    onError:   () => toast.error("Failed to remove"),
  });

  const highCount   = entries.filter((e) => e.entry.priority === "high").length;
  const budgetCount = entries.filter((e) => {
    const mp  = e.card.marketPrice ? parseFloat(e.card.marketPrice) : null;
    const mbp = e.entry.maxBuyPrice ? parseFloat(e.entry.maxBuyPrice) : null;
    return mp != null && mbp != null && mp <= mbp;
  }).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 lg:px-10">

      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">Wishlist</h1>
          <p className="mt-1 text-sm text-[#9A9A9A]">
            {isPending ? "Loading…" : (
              <>
                {entries.length} card{entries.length !== 1 ? "s" : ""}
                {highCount > 0 && <> · <span className="text-rose-400">{highCount} high priority</span></>}
                {budgetCount > 0 && <> · <span className="text-emerald-400">{budgetCount} under budget</span></>}
              </>
            )}
          </p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90">
          <PlusIcon className="size-4" /> Add to Wishlist
        </button>
      </div>

      {isPending && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-surface h-24" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-6 text-center text-sm text-rose-400">
          Failed to load wishlist. Please refresh.
        </div>
      )}

      {!isPending && !isError && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <p className="font-medium text-[#F2F2F2]">Your wishlist is empty</p>
          <p className="mt-1 text-sm text-[#9A9A9A]">Track cards you want to acquire.</p>
          <button onClick={() => setAddOpen(true)}
            className="mt-5 flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition">
            <PlusIcon className="size-4" /> Add to Wishlist
          </button>
        </div>
      )}

      {!isPending && entries.length > 0 && (
        <div className="space-y-3">
          {entries.map(({ entry, card }) => (
            <WishlistRow
              key={entry.id} entry={entry} card={card}
              onEdit={() => setEditItem({ entry, card })}
              onDelete={() => deleteMutation.mutate(entry.id)}
              onAcquire={() => setAcquireItem({ entry, card })}
            />
          ))}
        </div>
      )}

      <AddWishlistDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={refetch} />
      <EditDialog item={editItem} onClose={() => setEditItem(null)} onSaved={refetch} />
      {acquireItem && <AcquireDialog item={acquireItem} onClose={() => setAcquireItem(null)} onAcquired={refetch} />}
    </div>
  );
}
