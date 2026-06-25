"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "sonner";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import {
  collectionEntrySchema,
  CONDITION_LABEL,
  CONDITION_SHORT,
  CONDITIONS,
  type CollectionEntryInput,
} from "@/lib/validations/collection";
import type { CardCatalog, UserCollection } from "@/db/schema/cards";
import { CardImage } from "@/components/CardImage";

// ── Types ─────────────────────────────────────────────────────────────────────

type CollectionEntry = { entry: UserCollection; card: CardCatalog };
type SearchCard = CardCatalog;
type GameFilter = "pokemon" | "one_piece" | "all";

// ── Constants ─────────────────────────────────────────────────────────────────

const CONDITION_COLOR: Record<(typeof CONDITIONS)[number], string> = {
  near_mint:         "text-emerald-400 bg-emerald-400/10 ring-emerald-400/20",
  lightly_played:    "text-sky-400 bg-sky-400/10 ring-sky-400/20",
  moderately_played: "text-yellow-400 bg-yellow-400/10 ring-yellow-400/20",
  heavily_played:    "text-orange-400 bg-orange-400/10 ring-orange-400/20",
  damaged:           "text-rose-400 bg-rose-400/10 ring-rose-400/20",
};

const GAME_LABEL: Record<string, string> = {
  pokemon:   "Pokémon",
  one_piece: "One Piece",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: string | null | undefined, fallback = "—") {
  if (n == null) return fallback;
  const v = parseFloat(n);
  return isNaN(v) ? fallback : `$${v.toFixed(2)}`;
}

function totalValue(entries: CollectionEntry[]) {
  return entries.reduce((sum, { entry, card }) => {
    const price = parseFloat(card.marketPrice ?? "0");
    return sum + price * entry.quantity;
  }, 0);
}

// ── Card image ────────────────────────────────────────────────────────────────

// ── Entry card in the grid ────────────────────────────────────────────────────

function EntryCard({
  entry,
  card,
  onEdit,
  onDelete,
  onFavorite,
}: {
  entry: UserCollection;
  card: CardCatalog;
  onEdit: () => void;
  onDelete: () => void;
  onFavorite: () => void;
}) {
  const isGraded = entry.gradingCompany !== "none";
  const entryValue = parseFloat(card.marketPrice ?? "0") * entry.quantity;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-surface transition hover:border-white/16">
      {/* Card image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface2">
        <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />

        {/* Badges overlay */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {entry.isFoil && (
            <span className="rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase text-yellow-300">
              Foil
            </span>
          )}
          {entry.isFirstEdition && (
            <span className="rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase text-purple-300">
              1st Ed
            </span>
          )}
        </div>

        {/* Quantity badge */}
        {entry.quantity > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            ×{entry.quantity}
          </span>
        )}

        {/* Action buttons — visible on hover */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onFavorite} className="p-1 text-yellow-400 hover:scale-110 transition">
            {entry.isFavorite
              ? <StarSolid className="size-4" />
              : <StarIcon className="size-4 text-white/60" />}
          </button>
          <div className="flex gap-1">
            <button onClick={onEdit}
              className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 transition">
              <PencilSquareIcon className="size-3.5" />
            </button>
            <button onClick={onDelete}
              className="rounded-lg bg-rose-500/20 p-1.5 text-rose-400 hover:bg-rose-500/30 transition">
              <TrashIcon className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-3">
        <p className="truncate text-sm font-semibold text-[#F2F2F2]">{card.name}</p>
        <p className="truncate text-xs text-[#9A9A9A]">
          {card.setName ?? GAME_LABEL[card.game] ?? card.game}
          {card.cardNumber ? ` · ${card.cardNumber}` : ""}
        </p>

        <div className="mt-1 flex items-center justify-between">
          {isGraded ? (
            <span className="rounded-full bg-purple-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-400 ring-1 ring-purple-400/20">
              {entry.gradingCompany!.toUpperCase()} {entry.gradeValue}
            </span>
          ) : (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${CONDITION_COLOR[entry.condition]}`}>
              {CONDITION_SHORT[entry.condition]}
            </span>
          )}
          <span className="text-xs font-semibold text-[#F2F2F2]">
            {isNaN(entryValue) || entryValue === 0 ? "—" : `$${entryValue.toFixed(2)}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Entry form (used in both add and edit dialogs) ────────────────────────────

function EntryForm({
  card,
  defaultValues,
  onSubmit,
  onBack,
  submitLabel,
}: {
  card: SearchCard;
  defaultValues?: Partial<CollectionEntryInput>;
  onSubmit: (data: CollectionEntryInput) => Promise<void>;
  onBack?: () => void;
  submitLabel: string;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<CollectionEntryInput>({
      resolver: zodResolver(collectionEntrySchema) as Resolver<CollectionEntryInput>,
      defaultValues: {
        cardId:         card.id,
        quantity:       1,
        isGraded:       false,
        condition:      "near_mint",
        gradingCompany: "none",
        isFoil:         false,
        isFirstEdition: false,
        language:       "en",
        ...defaultValues,
      },
    });

  const isGraded = watch("isGraded");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Selected card preview */}
      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-surface2 p-3">
        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-md">
          <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#F2F2F2]">{card.name}</p>
          <p className="truncate text-xs text-[#9A9A9A]">
            {card.setName ?? GAME_LABEL[card.game]}
            {card.cardNumber ? ` · ${card.cardNumber}` : ""}
          </p>
          {card.marketPrice && (
            <p className="text-[10px] text-[#9A9A9A]">Market: {fmt(card.marketPrice)} USD</p>
          )}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Quantity</label>
        <input
          {...register("quantity")}
          type="number"
          min={1} max={999}
          className="w-24 rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none"
        />
        {errors.quantity && <p className="text-xs text-rose-400">{errors.quantity.message}</p>}
      </div>

      {/* Raw vs Graded toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setValue("isGraded", false); setValue("gradingCompany", "none"); }}
          className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${!isGraded ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}
        >
          Raw
        </button>
        <button
          type="button"
          onClick={() => setValue("isGraded", true)}
          className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${isGraded ? "border-purple-400 bg-purple-400/10 text-purple-400" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}
        >
          Graded / Slabbed
        </button>
      </div>

      {/* Condition (raw) */}
      {!isGraded && (
        <div>
          <p className="mb-1.5 text-xs text-[#9A9A9A]">Condition</p>
          <div className="grid grid-cols-5 gap-1.5">
            {CONDITIONS.map((c) => {
              const active = watch("condition") === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue("condition", c)}
                  title={CONDITION_LABEL[c]}
                  className={`rounded-lg border py-2 text-[10px] font-bold uppercase transition ${active ? `${CONDITION_COLOR[c]} ring-1` : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}
                >
                  {CONDITION_SHORT[c]}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-right text-[10px] text-[#9A9A9A]">
            {CONDITION_LABEL[watch("condition")]}
          </p>
        </div>
      )}

      {/* Grading fields */}
      {isGraded && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Company</label>
            <div className="flex gap-2">
              {(["psa", "bgs", "cgc"] as const).map((co) => {
                const active = watch("gradingCompany") === co;
                return (
                  <button key={co} type="button"
                    onClick={() => setValue("gradingCompany", co)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase transition ${active ? "border-purple-400 bg-purple-400/10 text-purple-400" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
                    {co.toUpperCase()}
                  </button>
                );
              })}
            </div>
            {errors.gradingCompany && <p className="text-xs text-rose-400">{errors.gradingCompany.message}</p>}
          </div>
          <div className="flex items-center gap-3">
            <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Grade</label>
            <input
              {...register("gradeValue")}
              type="number"
              min={1} max={10} step={0.5}
              placeholder="e.g. 9.5"
              className="w-24 rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none"
            />
            {errors.gradeValue && <p className="text-xs text-rose-400">{errors.gradeValue.message}</p>}
          </div>
        </div>
      )}

      {/* Foil + 1st Ed */}
      <div className="flex gap-4">
        {[
          { field: "isFoil"         as const, label: "Foil" },
          { field: "isFirstEdition" as const, label: "1st Edition" },
        ].map(({ field, label }) => (
          <label key={field} className="flex cursor-pointer items-center gap-2 text-xs text-[#9A9A9A]">
            <input {...register(field)} type="checkbox"
              className="size-4 rounded border-white/20 bg-surface2 accent-accent" />
            {label}
          </label>
        ))}
      </div>

      {/* Purchase price */}
      <div className="flex items-center gap-3">
        <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Paid (PHP)</label>
        <input
          {...register("purchasePrice")}
          type="number"
          min={0}
          step={0.01}
          placeholder="optional"
          className="w-36 rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-xs text-[#9A9A9A]">Notes (optional)</label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="e.g. bought at GP Manila 2024"
          className="w-full resize-none rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        {onBack && (
          <button type="button" onClick={onBack}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#9A9A9A] hover:text-[#F2F2F2] transition">
            ← Back
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ── Add Card dialog ───────────────────────────────────────────────────────────

function AddCardDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [step, setStep]           = useState<"search" | "configure">("search");
  const [game, setGame]           = useState<GameFilter>("all");
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<SearchCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<SearchCard | null>(null);
  const debounce                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("search"); setQuery(""); setResults([]); setSelected(null);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (query.trim().length < 2) { setResults([]); return; }

    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (game !== "all") params.set("game", game);
        const res  = await fetch(`/api/cards/search?${params}`);
        const json = await res.json();
        setResults(json.cards ?? []);
      } catch { setResults([]); }
      finally  { setSearching(false); }
    }, 500);

    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, game]);

  async function handleAdd(data: CollectionEntryInput) {
    const res = await fetch("/api/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add card");
    toast.success(`${selected!.name} added to collection`);
    onAdded();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#F2F2F2]">
              {step === "search" ? "Add a Card" : "Card Details"}
            </DialogTitle>
            <button onClick={onClose} className="text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              <XMarkIcon className="size-5" />
            </button>
          </div>

          {step === "search" ? (
            <div className="space-y-4">
              {/* Game filter */}
              <div className="flex gap-1.5 rounded-xl bg-surface2 p-1">
                {([["all", "All"], ["pokemon", "Pokémon"], ["one_piece", "One Piece"]] as const).map(([g, label]) => (
                  <button key={g} onClick={() => setGame(g)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${game === g ? "bg-surface text-[#F2F2F2] shadow" : "text-[#9A9A9A] hover:text-[#F2F2F2]"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9A9A]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search cards…"
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-surface2 py-2.5 pl-9 pr-4 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
                />
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {searching && (
                  <p className="py-6 text-center text-xs text-[#9A9A9A]">Searching…</p>
                )}
                {!searching && query.length >= 2 && results.length === 0 && (
                  <p className="py-6 text-center text-xs text-[#9A9A9A]">
                    No cards found. Try a different spelling.
                  </p>
                )}
                {results.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => { setSelected(card); setStep("configure"); }}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:border-white/10 hover:bg-surface2"
                  >
                    <div className="h-12 w-9 shrink-0 overflow-hidden rounded-md">
                      <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#F2F2F2]">{card.name}</p>
                      <p className="truncate text-xs text-[#9A9A9A]">
                        {card.setName ?? GAME_LABEL[card.game]}
                        {card.cardNumber ? ` · ${card.cardNumber}` : ""}
                      </p>
                    </div>
                    {card.marketPrice && (
                      <span className="shrink-0 text-xs text-[#9A9A9A]">{fmt(card.marketPrice)}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            selected && (
              <EntryForm
                card={selected}
                onSubmit={handleAdd}
                onBack={() => setStep("search")}
                submitLabel="Add to Collection"
              />
            )
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Edit dialog ───────────────────────────────────────────────────────────────

function EditDialog({
  item,
  onClose,
  onSaved,
}: {
  item: CollectionEntry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  if (!item) return null;

  async function handleSave(data: CollectionEntryInput) {
    const res = await fetch(`/api/collection/${item!.entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save");
    toast.success("Entry updated");
    onSaved();
    onClose();
  }

  const e = item.entry;
  const defaults: Partial<CollectionEntryInput> = {
    cardId:         e.cardId,
    quantity:       e.quantity,
    isGraded:       e.gradingCompany !== "none",
    condition:      e.condition,
    gradingCompany: e.gradingCompany,
    gradeValue:     e.gradeValue != null ? parseFloat(e.gradeValue) : undefined,
    isFoil:         e.isFoil,
    isFirstEdition: e.isFirstEdition,
    language:       e.language,
    purchasePrice:  e.purchasePrice != null ? parseFloat(e.purchasePrice) : undefined,
    notes:          e.notes ?? undefined,
  };

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#F2F2F2]">Edit Entry</DialogTitle>
            <button onClick={onClose} className="text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              <XMarkIcon className="size-5" />
            </button>
          </div>
          <EntryForm
            card={item.card}
            defaultValues={defaults}
            onSubmit={handleSave}
            submitLabel="Save Changes"
          />
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CollectionPage() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen]           = useState(false);
  const [editItem, setEditItem]         = useState<CollectionEntry | null>(null);
  const [deletePending, setDeletePending] = useState<string | null>(null);

  const { data, isPending, isError } = useQuery<{ entries: CollectionEntry[] }>({
    queryKey: ["collection"],
    queryFn: () => fetch("/api/collection").then((r) => r.json()),
  });

  const entries = data?.entries ?? [];
  const cardCount = entries.reduce((n, { entry }) => n + entry.quantity, 0);
  const value     = totalValue(entries);

  const refetch = () => qc.invalidateQueries({ queryKey: ["collection"] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/collection/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete");
      }),
    onSuccess: () => { toast.success("Card removed"); refetch(); },
    onError:   () => toast.error("Failed to remove card"),
    onSettled: () => setDeletePending(null),
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite, entry }: { id: string; isFavorite: boolean; entry: CollectionEntry }) =>
      fetch(`/api/collection/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId:         entry.entry.cardId,
          quantity:       entry.entry.quantity,
          isGraded:       entry.entry.gradingCompany !== "none",
          condition:      entry.entry.condition,
          gradingCompany: entry.entry.gradingCompany,
          gradeValue:     entry.entry.gradeValue != null ? parseFloat(entry.entry.gradeValue) : undefined,
          isFoil:         entry.entry.isFoil,
          isFirstEdition: entry.entry.isFirstEdition,
          language:       entry.entry.language,
          purchasePrice:  entry.entry.purchasePrice != null ? parseFloat(entry.entry.purchasePrice) : undefined,
          notes:          entry.entry.notes ?? undefined,
          isFavorite,
        }),
      }),
    onSuccess: () => refetch(),
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">

      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">My Collection</h1>
          <p className="mt-1 text-sm text-[#9A9A9A]">
            {isPending ? "Loading…" : `${cardCount} card${cardCount !== 1 ? "s" : ""} · $${value.toFixed(2)} USD est. value`}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
        >
          <PlusIcon className="size-4" />
          Add Card
        </button>
      </div>

      {/* States */}
      {isPending && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-surface aspect-[3/4]" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-6 text-center text-sm text-rose-400">
          Failed to load collection. Please refresh.
        </div>
      )}

      {!isPending && !isError && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <p className="text-[#F2F2F2] font-medium">No cards yet</p>
          <p className="mt-1 text-sm text-[#9A9A9A]">
            Add your first card to start tracking your collection.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="mt-5 flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition"
          >
            <PlusIcon className="size-4" />
            Add Card
          </button>
        </div>
      )}

      {/* Collection grid */}
      {!isPending && entries.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {entries.map(({ entry, card }) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              card={card}
              onEdit={() => setEditItem({ entry, card })}
              onDelete={() => {
                if (deletePending === entry.id) return;
                setDeletePending(entry.id);
                deleteMutation.mutate(entry.id);
              }}
              onFavorite={() =>
                favoriteMutation.mutate({ id: entry.id, isFavorite: !entry.isFavorite, entry: { entry, card } })
              }
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddCardDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={refetch}
      />
      <EditDialog
        item={editItem}
        onClose={() => setEditItem(null)}
        onSaved={refetch}
      />
    </div>
  );
}
