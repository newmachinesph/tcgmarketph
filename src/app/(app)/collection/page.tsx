"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  StarIcon,
  XMarkIcon,
  FolderPlusIcon,
  FolderIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import {
  CONDITION_MULTIPLIER,
  CONDITION_COLOR,
  CONDITION_SHORT,
  type CollectionEntryInput,
} from "@/lib/validations/collection";
import { GAME_LABEL } from "@/lib/constants/games";
import { FOLDER_COLORS } from "@/lib/constants/folders";
import type { CardCatalog, UserCollection, CollectionFolder } from "@/db/schema/cards";
import { CardImage } from "@/components/CardImage";
import { Price } from "@/components/Price";
import { CollectionEntryForm } from "@/components/CollectionEntryForm";
import { useCurrencyStore } from "@/store/currency";

// ── Types ─────────────────────────────────────────────────────────────────────

type CollectionEntry = { entry: UserCollection; card: CardCatalog };

type FolderDialogState =
  | { mode: "create" }
  | { mode: "edit"; folder: CollectionFolder }
  | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function conditionAdjustedValue(entry: UserCollection, card: CardCatalog) {
  const isGraded = entry.gradingCompany !== "none";
  const mult     = isGraded ? 1 : (CONDITION_MULTIPLIER[entry.condition] ?? 1);
  return parseFloat(card.marketPrice ?? "0") * entry.quantity * mult;
}

function totalValue(entries: CollectionEntry[]) {
  return entries.reduce((sum, { entry, card }) => sum + conditionAdjustedValue(entry, card), 0);
}

// ── Droppable folder sidebar item ─────────────────────────────────────────────

function DroppableFolder({
  id, label, color, count, active, onClick, children,
}: {
  id: string; label: string; color?: string; count: number;
  active: boolean; onClick: () => void; children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`group flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition select-none
        ${active ? "bg-surface2 text-[#F2F2F2]" : "text-[#9A9A9A] hover:bg-surface2/50 hover:text-[#F2F2F2]"}
        ${isOver ? "ring-2 ring-accent/60 bg-accent/10" : ""}`}
      onClick={onClick}
    >
      <FolderIcon className="size-4 shrink-0" style={{ color: color ?? "#9A9A9A" }} />
      <span className="flex-1 truncate text-sm font-medium">{label}</span>
      <span className="text-xs text-[#9A9A9A]">{count}</span>
      {children}
    </div>
  );
}

// ── Draggable card tile ───────────────────────────────────────────────────────

function DraggableCard({
  entry, card, onEdit, onDelete, onFavorite, onMove, isDragging,
}: {
  entry: UserCollection; card: CardCatalog;
  onEdit: () => void; onDelete: () => void;
  onFavorite: () => void; onMove: () => void;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: entry.id });
  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: 0.4, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef} style={style}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-surface transition hover:border-white/16 ${isDragging ? "opacity-40" : ""}`}
    >
      {/* Drag handle — desktop only */}
      <div
        {...listeners} {...attributes}
        className="absolute left-0 right-0 top-0 z-10 h-6 cursor-grab active:cursor-grabbing hidden sm:block"
        aria-label="Drag to move to a folder"
      />

      {/* Image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface2">
        <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />

        {entry.isFoil && (
          <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase text-yellow-300">Foil</span>
        )}
        {entry.isFirstEdition && (
          <span className="absolute left-2 top-8 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold uppercase text-purple-300">1st Ed</span>
        )}
        {entry.quantity > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">×{entry.quantity}</span>
        )}

        {/* Hover actions */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onFavorite}
            aria-label={entry.isFavorite ? "Remove from favourites" : "Add to favourites"}
            className="p-1 text-yellow-400 hover:scale-110 transition"
          >
            {entry.isFavorite ? <StarSolid className="size-4" /> : <StarIcon className="size-4 text-white/60" />}
          </button>
          <div className="flex gap-1">
            <button onClick={onMove} aria-label="Move to folder"
              className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 transition">
              <FolderIcon className="size-3.5" />
            </button>
            <button onClick={onEdit} aria-label="Edit entry"
              className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 transition">
              <PencilSquareIcon className="size-3.5" />
            </button>
            <button onClick={onDelete} aria-label="Delete from collection"
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
          {card.setName ?? GAME_LABEL[card.game]}{card.cardNumber ? ` · ${card.cardNumber}` : ""}
        </p>
        <div className="mt-1 flex items-center justify-between">
          {entry.gradingCompany !== "none" ? (
            <span className="rounded-full bg-purple-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-400 ring-1 ring-purple-400/20">
              {entry.gradingCompany!.toUpperCase()} {entry.gradeValue}
            </span>
          ) : (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${CONDITION_COLOR[entry.condition]}`}>
              {CONDITION_SHORT[entry.condition]}
            </span>
          )}
          <Price usd={conditionAdjustedValue(entry, card) || null} className="text-xs font-semibold text-[#F2F2F2]" />
        </div>
      </div>

      {/* Mobile move button */}
      <button onClick={onMove} aria-label="Move to folder"
        className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white/70 sm:hidden">
        <FolderIcon className="size-3.5" />
      </button>
    </div>
  );
}

// ── Folder sidebar ────────────────────────────────────────────────────────────

function FolderSidebar({
  folders, entries, activeFolder, setActiveFolder,
  onCreateFolder, onRenameFolder, onDeleteFolder,
}: {
  folders: CollectionFolder[]; entries: CollectionEntry[];
  activeFolder: string | null; setActiveFolder: (id: string | null) => void;
  onCreateFolder: () => void;
  onRenameFolder: (folder: CollectionFolder) => void;
  onDeleteFolder: (folder: CollectionFolder) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <DroppableFolder
        id="__all__" label="All Cards" count={entries.length}
        active={activeFolder === null} onClick={() => setActiveFolder(null)}
      />

      {folders.length > 0 && <div className="my-1 border-t border-white/8" />}

      {folders.map((folder) => {
        const count = entries.filter((e) => e.entry.folderId === folder.id).length;
        return (
          <div key={folder.id} className="group/folder relative">
            <DroppableFolder
              id={folder.id} label={folder.name} color={folder.color}
              count={count} active={activeFolder === folder.id}
              onClick={() => setActiveFolder(folder.id)}
            >
              <div className="invisible flex items-center gap-0.5 group-hover/folder:visible">
                <button
                  onClick={(e) => { e.stopPropagation(); onRenameFolder(folder); }}
                  aria-label={`Rename folder ${folder.name}`}
                  className="rounded p-0.5 text-[#9A9A9A] hover:text-[#F2F2F2] transition"
                >
                  <PencilSquareIcon className="size-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder); }}
                  aria-label={`Delete folder ${folder.name}`}
                  className="rounded p-0.5 text-[#9A9A9A] hover:text-rose-400 transition"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </div>
            </DroppableFolder>
          </div>
        );
      })}

      <button onClick={onCreateFolder}
        className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#9A9A9A] transition hover:text-[#F2F2F2]">
        <FolderPlusIcon className="size-4" />
        New Folder
      </button>
    </div>
  );
}

// ── Create / Rename folder dialog ─────────────────────────────────────────────

function FolderDialog({ state, onClose, onSaved }: {
  state: FolderDialogState; onClose: () => void; onSaved: () => void;
}) {
  const isEdit      = state?.mode === "edit";
  const folder      = isEdit ? state.folder : null;
  const [name, setName]     = useState(folder?.name ?? "");
  const [color, setColor]   = useState(folder?.color ?? "#6366f1");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const url    = isEdit ? `/api/collection/folders/${folder!.id}` : "/api/collection/folders";
      const method = isEdit ? "PATCH" : "POST";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), color }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(isEdit ? "Folder renamed" : "Folder created");
      onSaved(); onClose();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (!state) return null;

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <DialogTitle className="mb-5 text-base font-bold text-[#F2F2F2]">
            {isEdit ? "Rename Folder" : "New Folder"}
          </DialogTitle>
          <div className="space-y-4">
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="Folder name" autoFocus maxLength={50}
              className="w-full rounded-xl border border-white/10 bg-surface2 px-4 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
            />
            <div>
              <p className="mb-2 text-xs text-[#9A9A9A]">Color</p>
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((c) => (
                  <button key={c} onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                    className={`size-7 rounded-full transition hover:scale-110 ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-surface" : ""}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <button onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !name.trim()}
              className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50">
              {saving ? "Saving…" : isEdit ? "Rename" : "Create"}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Confirm delete folder dialog ──────────────────────────────────────────────

function ConfirmDeleteFolderDialog({ folder, onClose, onConfirm }: {
  folder: CollectionFolder | null; onClose: () => void; onConfirm: () => void;
}) {
  if (!folder) return null;
  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <DialogTitle className="mb-2 text-base font-bold text-[#F2F2F2]">Delete folder?</DialogTitle>
          <p className="text-sm text-[#9A9A9A]">
            <span className="font-semibold text-[#F2F2F2]">{folder.name}</span> will be deleted.
            Cards inside will move back to All Cards.
          </p>
          <div className="mt-5 flex gap-2">
            <button onClick={onClose}
              className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 rounded-lg bg-rose-500 py-2 text-sm font-semibold text-white transition hover:bg-rose-600">
              Delete
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Move to folder dialog (mobile) ────────────────────────────────────────────

function MoveFolderDialog({ entry, folders, onClose, onMoved }: {
  entry: CollectionEntry | null; folders: CollectionFolder[];
  onClose: () => void; onMoved: () => void;
}) {
  const [moving, setMoving] = useState<string | null>(null);
  if (!entry) return null;

  async function moveTo(folderId: string | null) {
    setMoving(folderId ?? "__null__");
    try {
      const res = await fetch(`/api/collection/${entry!.entry.id}/move`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(folderId ? "Moved to folder" : "Moved to All Cards");
      onMoved(); onClose();
    } catch {
      toast.error("Failed to move card");
    } finally {
      setMoving(null);
    }
  }

  const currentFolder = entry.entry.folderId;

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
        <DialogPanel className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="text-sm font-bold text-[#F2F2F2]">Move — {entry.card.name}</DialogTitle>
            <button onClick={onClose} aria-label="Close" className="text-[#9A9A9A] hover:text-[#F2F2F2]">
              <XMarkIcon className="size-5" />
            </button>
          </div>
          <div className="space-y-1">
            <button onClick={() => moveTo(null)} disabled={moving !== null}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-surface2 ${currentFolder === null ? "text-accent" : "text-[#9A9A9A]"}`}>
              <FolderIcon className="size-4 shrink-0 text-[#9A9A9A]" />
              <span className="flex-1 text-left font-medium">All Cards (unfiled)</span>
              {currentFolder === null && <CheckIcon className="size-4 text-accent" />}
              {moving === "__null__" && <span className="text-xs">Moving…</span>}
            </button>
            {folders.map((folder) => (
              <button key={folder.id} onClick={() => moveTo(folder.id)} disabled={moving !== null}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-surface2 ${currentFolder === folder.id ? "text-accent" : "text-[#9A9A9A]"}`}>
                <FolderIcon className="size-4 shrink-0" style={{ color: folder.color }} />
                <span className="flex-1 text-left font-medium">{folder.name}</span>
                {currentFolder === folder.id && <CheckIcon className="size-4 text-accent" />}
                {moving === folder.id && <span className="text-xs">Moving…</span>}
              </button>
            ))}
            {folders.length === 0 && (
              <p className="px-3 py-4 text-center text-xs text-[#9A9A9A]">No folders yet — create one first</p>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Add Card dialog ───────────────────────────────────────────────────────────

function AddCardDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [step, setStep]           = useState<"search" | "configure">("search");
  const [game, setGame]           = useState<"all" | "pokemon" | "one_piece">("all");
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<CardCatalog[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected]   = useState<CardCatalog | null>(null);
  const debounceRef               = useState<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => { setStep("search"); setQuery(""); setResults([]); setSelected(null); };

  function handleSearch(q: string, g: typeof game) {
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

  async function handleAdd(data: CollectionEntryInput) {
    const res = await fetch("/api/collection", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed");
    toast.success(`${selected!.name} added to collection`);
    onAdded(); onClose(); reset();
  }

  return (
    <Dialog open={open} onClose={() => { onClose(); reset(); }} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#F2F2F2]">
              {step === "search" ? "Add a Card" : "Card Details"}
            </DialogTitle>
            <button onClick={() => { onClose(); reset(); }} aria-label="Close"
              className="text-[#9A9A9A] hover:text-[#F2F2F2] transition">
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
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); handleSearch(e.target.value, game); }}
                  placeholder="Search cards…" autoFocus
                  className="w-full rounded-xl border border-white/10 bg-surface2 py-2.5 pl-9 pr-4 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
                />
              </div>
              <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
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
                      <p className="truncate text-xs text-[#9A9A9A]">{card.setName ?? GAME_LABEL[card.game]}{card.cardNumber ? ` · ${card.cardNumber}` : ""}</p>
                    </div>
                    {card.marketPrice && <Price usd={card.marketPrice} className="shrink-0 text-xs text-[#9A9A9A]" />}
                  </button>
                ))}
              </div>
            </div>
          ) : selected && (
            <CollectionEntryForm
              card={selected} onSubmit={handleAdd}
              submitLabel="Add to Collection" onBack={() => setStep("search")}
            />
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Edit dialog ───────────────────────────────────────────────────────────────

function EditDialog({ item, onClose, onSaved }: { item: CollectionEntry | null; onClose: () => void; onSaved: () => void }) {
  if (!item) return null;
  const e = item.entry;

  async function handleSave(data: CollectionEntryInput) {
    const res = await fetch(`/api/collection/${e.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed");
    toast.success("Entry updated"); onSaved(); onClose();
  }

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-[#F2F2F2]">Edit Entry</DialogTitle>
            <button onClick={onClose} aria-label="Close" className="text-[#9A9A9A] hover:text-[#F2F2F2] transition">
              <XMarkIcon className="size-5" />
            </button>
          </div>
          <CollectionEntryForm
            card={item.card} onSubmit={handleSave} submitLabel="Save Changes"
            defaultValues={{
              cardId: e.cardId, quantity: e.quantity,
              isGraded: e.gradingCompany !== "none", condition: e.condition,
              gradingCompany: e.gradingCompany,
              gradeValue: e.gradeValue != null ? parseFloat(e.gradeValue) : undefined,
              isFoil: e.isFoil, isFirstEdition: e.isFirstEdition, language: e.language,
              purchasePrice: e.purchasePrice != null ? parseFloat(e.purchasePrice) : undefined,
              notes: e.notes ?? undefined, isFavorite: e.isFavorite,
            }}
          />
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CollectionPage() {
  const qc              = useQueryClient();
  const { format }      = useCurrencyStore();

  const [addOpen, setAddOpen]           = useState(false);
  const [editItem, setEditItem]         = useState<CollectionEntry | null>(null);
  const [moveItem, setMoveItem]         = useState<CollectionEntry | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [draggingId, setDraggingId]     = useState<string | null>(null);
  const [folderDialog, setFolderDialog] = useState<FolderDialogState>(null);
  const [deleteFolder, setDeleteFolder] = useState<CollectionFolder | null>(null);

  const { data: collData, isPending: collPending, isError: collError } =
    useQuery<{ entries: CollectionEntry[] }>({
      queryKey: ["collection"],
      queryFn:  () => fetch("/api/collection").then((r) => r.json()),
      staleTime: 60_000,
    });

  const { data: folderData, isError: foldersError } =
    useQuery<{ folders: CollectionFolder[] }>({
      queryKey: ["collection-folders"],
      queryFn:  () => fetch("/api/collection/folders").then((r) => r.json()),
      staleTime: 60_000,
    });

  const entries = collData?.entries ?? [];
  const folders = folderData?.folders ?? [];

  const refetchAll = () => {
    qc.invalidateQueries({ queryKey: ["collection"] });
    qc.invalidateQueries({ queryKey: ["collection-folders"] });
  };

  const visible   = activeFolder === null ? entries : entries.filter((e) => e.entry.folderId === activeFolder);
  const cardCount = visible.reduce((n, { entry }) => n + entry.quantity, 0);
  const value     = totalValue(visible);

  // ── DnD — mouse sensor only; touch users use the "Move" button ──────────────

  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 8 } }));

  function onDragStart(event: DragStartEvent) {
    setDraggingId(String(event.active.id));
  }

  async function onDragEnd(event: DragEndEvent) {
    setDraggingId(null);
    const { active, over } = event;
    if (!over) return;

    const entryId  = String(active.id);
    const folderId = String(over.id) === "__all__" ? null : String(over.id);
    const entry    = entries.find((e) => e.entry.id === entryId);
    if (!entry || entry.entry.folderId === folderId) return;

    try {
      const res = await fetch(`/api/collection/${entryId}/move`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(`Moved to ${folderId ? (folders.find((f) => f.id === folderId)?.name ?? "folder") : "All Cards"}`);
      qc.invalidateQueries({ queryKey: ["collection"] });
    } catch {
      toast.error("Failed to move card");
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/collection/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) throw new Error(); }),
    onSuccess: () => { toast.success("Card removed"); refetchAll(); },
    onError:   () => toast.error("Failed to remove"),
  });

  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      fetch(`/api/collection/${id}/favorite`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite }),
      }).then((r) => { if (!r.ok) throw new Error(); }),
    onSuccess: () => refetchAll(),
    onError:   () => toast.error("Failed to update favourite"),
  });

  async function confirmDeleteFolder() {
    if (!deleteFolder) return;
    const res = await fetch(`/api/collection/folders/${deleteFolder.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Folder deleted");
      if (activeFolder === deleteFolder.id) setActiveFolder(null);
      refetchAll();
    } else {
      toast.error("Failed to delete folder");
    }
    setDeleteFolder(null);
  }

  const draggingEntry = draggingId ? entries.find((e) => e.entry.id === draggingId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:px-10">

        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">My Collection</h1>
            <p className="mt-1 text-sm text-[#9A9A9A]">
              {collPending ? "Loading…" : `${cardCount} card${cardCount !== 1 ? "s" : ""} · ${format(value)} est. value`}
            </p>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90">
            <PlusIcon className="size-4" /> Add Card
          </button>
        </div>

        {/* Error state */}
        {(collError || foldersError) && (
          <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-400">
            Failed to load collection data. Please refresh.
          </div>
        )}

        {/* Mobile folder tabs — outside the sidebar+grid flex row */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 sm:hidden">
          <button onClick={() => setActiveFolder(null)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${activeFolder === null ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-[#9A9A9A]"}`}>
            All ({entries.length})
          </button>
          {folders.map((folder) => (
            <button key={folder.id} onClick={() => setActiveFolder(folder.id)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition ${activeFolder === folder.id ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-[#9A9A9A]"}`}>
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
              {folder.name}
            </button>
          ))}
          <button onClick={() => setFolderDialog({ mode: "create" })}
            className="shrink-0 flex items-center gap-1 rounded-full border border-dashed border-white/20 px-4 py-1.5 text-xs text-[#9A9A9A]">
            <FolderPlusIcon className="size-3.5" /> New
          </button>
        </div>

        {/* Sidebar + grid row */}
        <div className="flex gap-6">
          {/* Folder sidebar — desktop */}
          <aside className="hidden w-52 shrink-0 sm:block">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#9A9A9A]">Folders</p>
            <FolderSidebar
              folders={folders} entries={entries}
              activeFolder={activeFolder} setActiveFolder={setActiveFolder}
              onCreateFolder={() => setFolderDialog({ mode: "create" })}
              onRenameFolder={(f) => setFolderDialog({ mode: "edit", folder: f })}
              onDeleteFolder={(f) => setDeleteFolder(f)}
            />
          </aside>

          {/* Main grid */}
          <div className="min-w-0 flex-1">
            {collPending && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl bg-surface aspect-[3/4]" />
                ))}
              </div>
            )}

            {!collPending && !collError && visible.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
                <p className="font-medium text-[#F2F2F2]">
                  {activeFolder ? "This folder is empty" : "No cards yet"}
                </p>
                <p className="mt-1 text-sm text-[#9A9A9A]">
                  {activeFolder ? "Drag cards here or use the Move button" : "Add your first card to start tracking"}
                </p>
                {!activeFolder && (
                  <button onClick={() => setAddOpen(true)}
                    className="mt-5 flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90 transition">
                    <PlusIcon className="size-4" /> Add Card
                  </button>
                )}
              </div>
            )}

            {!collPending && visible.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {visible.map(({ entry, card }) => (
                  <DraggableCard
                    key={entry.id} entry={entry} card={card}
                    isDragging={draggingId === entry.id}
                    onEdit={() => setEditItem({ entry, card })}
                    onDelete={() => deleteMutation.mutate(entry.id)}
                    onFavorite={() => favoriteMutation.mutate({ id: entry.id, isFavorite: !entry.isFavorite })}
                    onMove={() => setMoveItem({ entry, card })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggingEntry && (
          <div className="w-36 rounded-2xl border border-accent/40 bg-surface shadow-2xl opacity-90 overflow-hidden">
            <div className="relative aspect-[3/4] overflow-hidden">
              <CardImage url={draggingEntry.card.imageUrl} name={draggingEntry.card.name} className="h-full w-full" />
            </div>
            <p className="truncate px-3 py-2 text-xs font-semibold text-[#F2F2F2]">{draggingEntry.card.name}</p>
          </div>
        )}
      </DragOverlay>

      {/* Dialogs */}
      <AddCardDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={refetchAll} />
      <EditDialog item={editItem} onClose={() => setEditItem(null)} onSaved={refetchAll} />
      <MoveFolderDialog entry={moveItem} folders={folders} onClose={() => setMoveItem(null)} onMoved={refetchAll} />
      <FolderDialog state={folderDialog} onClose={() => setFolderDialog(null)} onSaved={refetchAll} />
      <ConfirmDeleteFolderDialog folder={deleteFolder} onClose={() => setDeleteFolder(null)} onConfirm={confirmDeleteFolder} />
    </DndContext>
  );
}
