"use client";

import { useState, useMemo } from "react";
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
  TagIcon,
  Squares2X2Icon,
  Bars4Icon,
  ChevronUpDownIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  StarIcon as StarSolid,
  CheckCircleIcon as CheckCircleSolid,
} from "@heroicons/react/24/solid";
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
type SortOption = "date_desc" | "date_asc" | "value_desc" | "value_asc" | "name_asc" | "name_desc";
type GameFilter = "all" | "pokemon" | "one_piece";

type FolderDialogState =
  | { mode: "create" }
  | { mode: "edit"; folder: CollectionFolder }
  | null;

// ── Sort options ──────────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date_desc",  label: "Newest First" },
  { value: "date_asc",   label: "Oldest First" },
  { value: "value_desc", label: "Value: High → Low" },
  { value: "value_asc",  label: "Value: Low → High" },
  { value: "name_asc",   label: "Name: A → Z" },
  { value: "name_desc",  label: "Name: Z → A" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function conditionAdjustedValue(entry: UserCollection, card: CardCatalog) {
  const isGraded = entry.gradingCompany !== "none";
  const mult     = isGraded ? 1 : (CONDITION_MULTIPLIER[entry.condition] ?? 1);
  return parseFloat(card.marketPrice ?? "0") * entry.quantity * mult;
}

function totalValue(entries: CollectionEntry[]) {
  return entries.reduce((sum, { entry, card }) => sum + conditionAdjustedValue(entry, card), 0);
}

// ── DroppableFolder ───────────────────────────────────────────────────────────

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

// ── DraggableCard (enhanced: bulk select) ─────────────────────────────────────

function DraggableCard({
  entry, card, onEdit, onDelete, onFavorite, onMove, isDragging,
  bulkMode, selected, onToggleSelect,
}: {
  entry: UserCollection; card: CardCatalog;
  onEdit: () => void; onDelete: () => void;
  onFavorite: () => void; onMove: () => void;
  isDragging: boolean;
  bulkMode: boolean; selected: boolean; onToggleSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: entry.id });
  const style = !bulkMode && transform
    ? { transform: CSS.Translate.toString(transform), opacity: 0.4, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={!bulkMode ? setNodeRef : undefined}
      style={style}
      onClick={bulkMode ? onToggleSelect : undefined}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-surface transition
        ${bulkMode ? "cursor-pointer" : ""}
        ${selected ? "border-accent ring-2 ring-accent/40" : "border-white/8 hover:border-white/16"}
        ${isDragging ? "opacity-40" : ""}
      `}
    >
      {/* Bulk mode checkbox */}
      {bulkMode && (
        <div className="absolute left-2 top-2 z-20 drop-shadow-md">
          {selected
            ? <CheckCircleSolid className="size-5 text-accent" />
            : <CheckCircleIcon className="size-5 text-white/70" />
          }
        </div>
      )}

      {/* Drag handle — desktop only, hidden in bulk mode */}
      {!bulkMode && (
        <div
          {...listeners} {...attributes}
          className="absolute left-0 right-0 top-0 z-10 h-6 cursor-grab active:cursor-grabbing hidden sm:block"
          aria-label="Drag to move to a folder"
        />
      )}

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

        {/* Hover actions — hidden in bulk mode */}
        {!bulkMode && (
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
              <a href={`/listings/new?fromCollection=${entry.id}`} aria-label="List this card for sale"
                className="rounded-lg bg-accent/20 p-1.5 text-accent hover:bg-accent/30 transition">
                <TagIcon className="size-3.5" />
              </a>
            </div>
          </div>
        )}
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

      {/* Mobile move button — hidden in bulk mode */}
      {!bulkMode && (
        <button onClick={onMove} aria-label="Move to folder"
          className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white/70 sm:hidden">
          <FolderIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// ── CollectionListRow ─────────────────────────────────────────────────────────

function CollectionListRow({
  entry, card, onEdit, onDelete, onFavorite, onMove,
  bulkMode, selected, onToggleSelect,
}: {
  entry: UserCollection; card: CardCatalog;
  onEdit: () => void; onDelete: () => void;
  onFavorite: () => void; onMove: () => void;
  bulkMode: boolean; selected: boolean; onToggleSelect: () => void;
}) {
  const value    = conditionAdjustedValue(entry, card);
  const isGraded = entry.gradingCompany !== "none";

  return (
    <div
      onClick={bulkMode ? onToggleSelect : undefined}
      className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition
        ${bulkMode ? "cursor-pointer" : ""}
        ${selected
          ? "border-accent/40 bg-accent/5 ring-1 ring-accent/30"
          : "border-white/6 bg-surface hover:border-white/12 hover:bg-surface2/40"}
      `}
    >
      {/* Bulk checkbox */}
      {bulkMode && (
        <div className="shrink-0">
          {selected
            ? <CheckCircleSolid className="size-4 text-accent" />
            : <CheckCircleIcon className="size-4 text-white/40" />
          }
        </div>
      )}

      {/* Card image thumbnail */}
      <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded-md">
        <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />
      </div>

      {/* Name + set */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F2F2F2]">
          {card.name}
          {entry.isFavorite && <StarSolid className="ml-1 inline-block size-3 align-text-top text-yellow-400" />}
        </p>
        <p className="truncate text-xs text-[#9A9A9A]">
          {card.setName ?? GAME_LABEL[card.game]}
          {card.cardNumber ? ` · ${card.cardNumber}` : ""}
        </p>
      </div>

      {/* Game badge */}
      <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-block
        ${card.game === "pokemon" ? "bg-yellow-400/10 text-yellow-400" : "bg-red-400/10 text-red-400"}`}>
        {card.game === "pokemon" ? "Pokémon" : "One Piece"}
      </span>

      {/* Condition / grade */}
      {isGraded ? (
        <span className="hidden shrink-0 rounded-full bg-purple-400/10 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-400 ring-1 ring-purple-400/20 sm:inline-block">
          {entry.gradingCompany!.toUpperCase()} {entry.gradeValue}
        </span>
      ) : (
        <span className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 sm:inline-block ${CONDITION_COLOR[entry.condition]}`}>
          {CONDITION_SHORT[entry.condition]}
        </span>
      )}

      {/* Foil / 1st Ed */}
      <div className="hidden shrink-0 items-center gap-1 lg:flex">
        {entry.isFoil && (
          <span className="rounded-full bg-yellow-400/10 px-1.5 py-0.5 text-[9px] font-bold text-yellow-300">Foil</span>
        )}
        {entry.isFirstEdition && (
          <span className="rounded-full bg-purple-400/10 px-1.5 py-0.5 text-[9px] font-bold text-purple-300">1st</span>
        )}
      </div>

      {/* Quantity */}
      <span className="w-7 shrink-0 text-right text-xs text-[#9A9A9A]">×{entry.quantity}</span>

      {/* Value */}
      <Price usd={value || null} className="w-20 shrink-0 text-right text-sm font-semibold text-[#F2F2F2]" />

      {/* Row actions — hidden in bulk mode */}
      {!bulkMode && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onFavorite} aria-label="Toggle favourite"
            className="rounded-lg p-1.5 text-[#9A9A9A] hover:text-yellow-400 transition">
            {entry.isFavorite ? <StarSolid className="size-4 text-yellow-400" /> : <StarIcon className="size-4" />}
          </button>
          <button onClick={onMove} aria-label="Move to folder"
            className="rounded-lg p-1.5 text-[#9A9A9A] hover:text-[#F2F2F2] transition">
            <FolderIcon className="size-4" />
          </button>
          <button onClick={onEdit} aria-label="Edit"
            className="rounded-lg p-1.5 text-[#9A9A9A] hover:text-[#F2F2F2] transition">
            <PencilSquareIcon className="size-4" />
          </button>
          <button onClick={onDelete} aria-label="Delete"
            className="rounded-lg p-1.5 text-[#9A9A9A] hover:text-rose-400 transition">
            <TrashIcon className="size-4" />
          </button>
          <a href={`/listings/new?fromCollection=${entry.id}`} aria-label="List for sale"
            className="rounded-lg p-1.5 text-[#9A9A9A] hover:text-accent transition">
            <TagIcon className="size-4" />
          </a>
        </div>
      )}
    </div>
  );
}

// ── FolderSidebar ─────────────────────────────────────────────────────────────

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

// ── SidebarBreakdown ──────────────────────────────────────────────────────────

function SidebarBreakdown({ entries }: { entries: CollectionEntry[] }) {
  if (entries.length === 0) return null;

  const pokemonQty  = entries.filter(({ card }) => card.game === "pokemon").reduce((n, { entry }) => n + entry.quantity, 0);
  const onePieceQty = entries.filter(({ card }) => card.game === "one_piece").reduce((n, { entry }) => n + entry.quantity, 0);

  type CondKey = "near_mint" | "lightly_played" | "moderately_played" | "heavily_played" | "damaged" | "graded";
  const byCondition: Record<CondKey, number> = {
    near_mint:         entries.filter(({ entry }) => entry.condition === "near_mint" && entry.gradingCompany === "none").length,
    lightly_played:    entries.filter(({ entry }) => entry.condition === "lightly_played" && entry.gradingCompany === "none").length,
    moderately_played: entries.filter(({ entry }) => entry.condition === "moderately_played" && entry.gradingCompany === "none").length,
    heavily_played:    entries.filter(({ entry }) => entry.condition === "heavily_played" && entry.gradingCompany === "none").length,
    damaged:           entries.filter(({ entry }) => entry.condition === "damaged" && entry.gradingCompany === "none").length,
    graded:            entries.filter(({ entry }) => entry.gradingCompany !== "none").length,
  };
  const maxCond = Math.max(...Object.values(byCondition), 1);

  const condRows: [string, CondKey, string][] = [
    ["NM",     "near_mint",          "bg-emerald-400"],
    ["LP",     "lightly_played",     "bg-lime-400"],
    ["MP",     "moderately_played",  "bg-yellow-400"],
    ["HP",     "heavily_played",     "bg-orange-400"],
    ["DMG",    "damaged",            "bg-rose-400"],
    ["Graded", "graded",             "bg-purple-400"],
  ];

  return (
    <div className="mt-5 border-t border-white/8 pt-4">
      <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#9A9A9A]">Breakdown</p>

      {/* By game */}
      <div className="mb-4 space-y-1.5">
        {pokemonQty > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-[#9A9A9A]">Pokémon</span>
            <span className="text-xs font-semibold text-[#F2F2F2]">{pokemonQty}</span>
          </div>
        )}
        {onePieceQty > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-[#9A9A9A]">One Piece</span>
            <span className="text-xs font-semibold text-[#F2F2F2]">{onePieceQty}</span>
          </div>
        )}
      </div>

      {/* By condition */}
      <p className="mb-2 px-1 text-[10px] text-[#9A9A9A]">Condition</p>
      <div className="space-y-1.5">
        {condRows.map(([label, key, color]) =>
          byCondition[key] > 0 ? (
            <div key={key} className="flex items-center gap-2 px-1">
              <span className="w-9 shrink-0 text-[10px] text-[#9A9A9A]">{label}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-white/8 h-1.5">
                <div
                  className={`h-full rounded-full ${color} transition-all`}
                  style={{ width: `${(byCondition[key] / maxCond) * 100}%` }}
                />
              </div>
              <span className="w-4 text-right text-[10px] tabular-nums text-[#9A9A9A]">{byCondition[key]}</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────

function FilterBar({
  searchQuery, onSearch,
  gameFilter, onGameFilter,
  sortBy, onSort,
  viewMode, onViewMode,
  bulkMode, onBulkMode,
  resultCount, totalCount,
}: {
  searchQuery: string; onSearch: (q: string) => void;
  gameFilter: GameFilter; onGameFilter: (g: GameFilter) => void;
  sortBy: SortOption; onSort: (s: SortOption) => void;
  viewMode: "grid" | "list"; onViewMode: (v: "grid" | "list") => void;
  bulkMode: boolean; onBulkMode: (b: boolean) => void;
  resultCount: number; totalCount: number;
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const isFiltered = searchQuery || gameFilter !== "all";

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {/* Search input */}
      <div className="relative min-w-0 flex-1 basis-48">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9A9A]" />
        <input
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search in collection…"
          className="w-full rounded-xl border border-white/10 bg-surface2 py-2 pl-9 pr-8 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => onSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A9A9A] hover:text-[#F2F2F2] transition">
            <XMarkIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Game filter */}
      <div className="flex rounded-xl border border-white/10 bg-surface2 p-0.5">
        {([["all", "All"], ["pokemon", "Pokémon"], ["one_piece", "One Piece"]] as [GameFilter, string][]).map(([g, label]) => (
          <button
            key={g}
            onClick={() => onGameFilter(g)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition
              ${gameFilter === g ? "bg-surface text-[#F2F2F2] shadow" : "text-[#9A9A9A] hover:text-[#F2F2F2]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="relative">
        <button
          onClick={() => setSortOpen((o) => !o)}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface2 px-3 py-2 text-xs font-medium text-[#9A9A9A] hover:text-[#F2F2F2] transition"
        >
          <ChevronUpDownIcon className="size-3.5" />
          <span className="hidden sm:inline">{SORT_OPTIONS.find((s) => s.value === sortBy)?.label ?? "Sort"}</span>
          <span className="sm:hidden">Sort</span>
        </button>
        {sortOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-white/10 bg-surface py-1 shadow-2xl">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onSort(opt.value); setSortOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-surface2
                    ${sortBy === opt.value ? "text-accent" : "text-[#9A9A9A] hover:text-[#F2F2F2]"}`}
                >
                  {sortBy === opt.value
                    ? <CheckIcon className="size-3.5 shrink-0" />
                    : <span className="size-3.5 shrink-0" />
                  }
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View mode toggle */}
      <div className="flex rounded-xl border border-white/10 bg-surface2 p-0.5">
        <button
          onClick={() => onViewMode("grid")}
          aria-label="Grid view"
          className={`rounded-lg p-1.5 transition ${viewMode === "grid" ? "bg-surface text-[#F2F2F2] shadow" : "text-[#9A9A9A] hover:text-[#F2F2F2]"}`}
        >
          <Squares2X2Icon className="size-4" />
        </button>
        <button
          onClick={() => onViewMode("list")}
          aria-label="List view"
          className={`rounded-lg p-1.5 transition ${viewMode === "list" ? "bg-surface text-[#F2F2F2] shadow" : "text-[#9A9A9A] hover:text-[#F2F2F2]"}`}
        >
          <Bars4Icon className="size-4" />
        </button>
      </div>

      {/* Bulk select toggle */}
      <button
        onClick={() => onBulkMode(!bulkMode)}
        className={`rounded-xl border px-3 py-2 text-xs font-medium transition
          ${bulkMode
            ? "border-accent bg-accent/10 text-accent"
            : "border-white/10 bg-surface2 text-[#9A9A9A] hover:text-[#F2F2F2]"}`}
      >
        {bulkMode ? "Cancel" : "Select"}
      </button>

      {/* Filter result count hint */}
      {isFiltered && (
        <span className="text-xs text-[#9A9A9A]">
          {resultCount} of {totalCount}
        </span>
      )}
    </div>
  );
}

// ── BulkActionBar ─────────────────────────────────────────────────────────────

function BulkActionBar({
  selectedIds, folders, onClose, onDeleted, onMoved,
}: {
  selectedIds: Set<string>;
  folders: CollectionFolder[];
  onClose: () => void;
  onDeleted: () => void;
  onMoved: () => void;
}) {
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving]     = useState<string | null>(null);

  const count = selectedIds.size;
  if (count === 0) return null;

  async function handleBulkDelete() {
    setDeleting(true);
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          fetch(`/api/collection/${id}`, { method: "DELETE" }).then((r) => { if (!r.ok) throw new Error(); })
        )
      );
      toast.success(`${count} card${count > 1 ? "s" : ""} removed`);
      onDeleted();
      onClose();
    } catch {
      toast.error("Failed to remove some cards");
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkMove(folderId: string | null) {
    setMoving(folderId ?? "__null__");
    try {
      await Promise.all(
        [...selectedIds].map((id) =>
          fetch(`/api/collection/${id}/move`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderId }),
          }).then((r) => { if (!r.ok) throw new Error(); })
        )
      );
      toast.success(`${count} card${count > 1 ? "s" : ""} moved`);
      onMoved();
      onClose();
      setMoveOpen(false);
    } catch {
      toast.error("Failed to move some cards");
    } finally {
      setMoving(null);
    }
  }

  return (
    <>
      {/* Fixed bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-surface/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <span className="flex-1 text-sm font-medium text-[#F2F2F2]">
            {count} card{count > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => setMoveOpen(true)}
            className="rounded-xl border border-white/10 bg-surface2 px-4 py-2 text-sm text-[#F2F2F2] hover:bg-surface2/80 transition"
          >
            Move to Folder
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={deleting}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 transition disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {/* Bulk move folder picker */}
      {moveOpen && (
        <Dialog open onClose={() => setMoveOpen(false)} className="relative z-50">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
          <div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
            <DialogPanel className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <DialogTitle className="text-sm font-bold text-[#F2F2F2]">
                  Move {count} card{count > 1 ? "s" : ""} to…
                </DialogTitle>
                <button onClick={() => setMoveOpen(false)} className="text-[#9A9A9A] hover:text-[#F2F2F2]">
                  <XMarkIcon className="size-5" />
                </button>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleBulkMove(null)}
                  disabled={moving !== null}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#9A9A9A] transition hover:bg-surface2 hover:text-[#F2F2F2]"
                >
                  <FolderIcon className="size-4 shrink-0" />
                  <span className="flex-1 text-left font-medium">All Cards (unfiled)</span>
                  {moving === "__null__" && <span className="text-xs">Moving…</span>}
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => handleBulkMove(folder.id)}
                    disabled={moving !== null}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#9A9A9A] transition hover:bg-surface2 hover:text-[#F2F2F2]"
                  >
                    <FolderIcon className="size-4 shrink-0" style={{ color: folder.color }} />
                    <span className="flex-1 text-left font-medium">{folder.name}</span>
                    {moving === folder.id && <span className="text-xs">Moving…</span>}
                  </button>
                ))}
                {folders.length === 0 && (
                  <p className="px-3 py-4 text-center text-xs text-[#9A9A9A]">No folders yet</p>
                )}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      )}
    </>
  );
}

// ── FolderDialog ──────────────────────────────────────────────────────────────

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

// ── ConfirmDeleteFolderDialog ─────────────────────────────────────────────────

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

// ── MoveFolderDialog ──────────────────────────────────────────────────────────

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

// ── AddCardDialog ─────────────────────────────────────────────────────────────

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

// ── EditDialog ────────────────────────────────────────────────────────────────

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
  const qc         = useQueryClient();
  const { format } = useCurrencyStore();

  // Existing state
  const [addOpen, setAddOpen]           = useState(false);
  const [editItem, setEditItem]         = useState<CollectionEntry | null>(null);
  const [moveItem, setMoveItem]         = useState<CollectionEntry | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [draggingId, setDraggingId]     = useState<string | null>(null);
  const [folderDialog, setFolderDialog] = useState<FolderDialogState>(null);
  const [deleteFolder, setDeleteFolder] = useState<CollectionFolder | null>(null);

  // New filter / view state
  const [searchQuery, setSearchQuery] = useState("");
  const [gameFilter, setGameFilter]   = useState<GameFilter>("all");
  const [sortBy, setSortBy]           = useState<SortOption>("date_desc");
  const [viewMode, setViewMode]       = useState<"grid" | "list">("grid");
  const [bulkMode, setBulkMode]       = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Queries
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

  // Folder-scoped entries
  const visible = activeFolder === null
    ? entries
    : entries.filter((e) => e.entry.folderId === activeFolder);

  // Filtered + sorted entries for display
  const displayEntries = useMemo(() => {
    let result = visible;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(({ card }) => card.name.toLowerCase().includes(q));
    }
    if (gameFilter !== "all") {
      result = result.filter(({ card }) => card.game === gameFilter);
    }
    return result.slice().sort((a, b) => {
      switch (sortBy) {
        case "value_desc": return conditionAdjustedValue(b.entry, b.card) - conditionAdjustedValue(a.entry, a.card);
        case "value_asc":  return conditionAdjustedValue(a.entry, a.card) - conditionAdjustedValue(b.entry, b.card);
        case "name_asc":   return a.card.name.localeCompare(b.card.name);
        case "name_desc":  return b.card.name.localeCompare(a.card.name);
        case "date_asc":   return new Date(a.entry.createdAt).getTime() - new Date(b.entry.createdAt).getTime();
        case "date_desc":
        default:           return new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime();
      }
    });
  }, [visible, searchQuery, gameFilter, sortBy]);

  // Full-collection quick stats
  const stats = useMemo(() => ({
    totalCards:  entries.reduce((n, { entry }) => n + entry.quantity, 0),
    uniqueCards: new Set(entries.map(({ entry }) => entry.cardId)).size,
    totalVal:    totalValue(entries),
    setsCount:   new Set(entries.map(({ card }) => card.setName).filter(Boolean)).size,
  }), [entries]);

  // Bulk select helpers
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exitBulkMode() {
    setBulkMode(false);
    setSelectedIds(new Set());
  }

  function changeFolder(id: string | null) {
    setActiveFolder(id);
    setSelectedIds(new Set());
  }

  // DnD
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

  const draggingEntry  = draggingId ? entries.find((e) => e.entry.id === draggingId) : null;
  const displayCount   = displayEntries.reduce((n, { entry }) => n + entry.quantity, 0);
  const displayValue   = totalValue(displayEntries);
  const isFiltered     = !!(searchQuery || gameFilter !== "all");

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`mx-auto w-full max-w-6xl px-4 py-8 lg:px-10 ${bulkMode ? "pb-24" : ""}`}>

        {/* ── Header ── */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">My Collection</h1>
            <p className="mt-0.5 text-sm text-[#9A9A9A]">
              {collPending
                ? "Loading…"
                : `${displayCount} card${displayCount !== 1 ? "s" : ""} · ${format(displayValue)} est. value${isFiltered ? " (filtered)" : ""}`
              }
            </p>

            {/* Quick stat chips */}
            {!collPending && stats.totalCards > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface2 px-3 py-1">
                  <span className="text-xs font-semibold tabular-nums text-[#F2F2F2]">{stats.totalCards}</span>
                  <span className="text-xs text-[#9A9A9A]">total cards</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface2 px-3 py-1">
                  <span className="text-xs font-semibold tabular-nums text-[#F2F2F2]">{stats.uniqueCards}</span>
                  <span className="text-xs text-[#9A9A9A]">unique</span>
                </div>
                {stats.setsCount > 0 && (
                  <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface2 px-3 py-1">
                    <span className="text-xs font-semibold tabular-nums text-[#F2F2F2]">{stats.setsCount}</span>
                    <span className="text-xs text-[#9A9A9A]">sets</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface2 px-3 py-1">
                  <Price usd={stats.totalVal || null} className="text-xs font-semibold text-[#F2F2F2]" />
                  <span className="text-xs text-[#9A9A9A]">est. value</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setAddOpen(true)}
            className="shrink-0 flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            <PlusIcon className="size-4" /> Add Card
          </button>
        </div>

        {/* Error state */}
        {(collError || foldersError) && (
          <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-400">
            Failed to load collection data. Please refresh.
          </div>
        )}

        {/* Mobile folder tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 sm:hidden">
          <button onClick={() => changeFolder(null)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition ${activeFolder === null ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-[#9A9A9A]"}`}>
            All ({entries.length})
          </button>
          {folders.map((folder) => (
            <button key={folder.id} onClick={() => changeFolder(folder.id)}
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

        {/* Filter bar */}
        {!collPending && entries.length > 0 && (
          <FilterBar
            searchQuery={searchQuery} onSearch={setSearchQuery}
            gameFilter={gameFilter} onGameFilter={setGameFilter}
            sortBy={sortBy} onSort={setSortBy}
            viewMode={viewMode} onViewMode={setViewMode}
            bulkMode={bulkMode} onBulkMode={(b) => { setBulkMode(b); if (!b) setSelectedIds(new Set()); }}
            resultCount={displayEntries.length} totalCount={visible.length}
          />
        )}

        {/* Sidebar + main content */}
        <div className="flex gap-6">
          {/* Folder sidebar — desktop */}
          <aside className="hidden w-52 shrink-0 sm:block">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#9A9A9A]">Folders</p>
            <FolderSidebar
              folders={folders} entries={entries}
              activeFolder={activeFolder} setActiveFolder={changeFolder}
              onCreateFolder={() => setFolderDialog({ mode: "create" })}
              onRenameFolder={(f) => setFolderDialog({ mode: "edit", folder: f })}
              onDeleteFolder={(f) => setDeleteFolder(f)}
            />
            <SidebarBreakdown entries={entries} />
          </aside>

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Loading skeleton */}
            {collPending && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl bg-surface aspect-[3/4]" />
                ))}
              </div>
            )}

            {/* Empty states */}
            {!collPending && !collError && displayEntries.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
                {isFiltered ? (
                  <>
                    <p className="font-medium text-[#F2F2F2]">No cards match your filters</p>
                    <p className="mt-1 text-sm text-[#9A9A9A]">Try a different search or game filter</p>
                    <button
                      onClick={() => { setSearchQuery(""); setGameFilter("all"); }}
                      className="mt-4 rounded-xl border border-white/10 px-4 py-2 text-sm text-[#9A9A9A] hover:text-[#F2F2F2] transition"
                    >
                      Clear Filters
                    </button>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}

            {/* Grid view */}
            {!collPending && displayEntries.length > 0 && viewMode === "grid" && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {displayEntries.map(({ entry, card }) => (
                  <DraggableCard
                    key={entry.id} entry={entry} card={card}
                    isDragging={draggingId === entry.id}
                    bulkMode={bulkMode}
                    selected={selectedIds.has(entry.id)}
                    onToggleSelect={() => toggleSelect(entry.id)}
                    onEdit={() => { if (!bulkMode) setEditItem({ entry, card }); }}
                    onDelete={() => { if (!bulkMode) deleteMutation.mutate(entry.id); }}
                    onFavorite={() => { if (!bulkMode) favoriteMutation.mutate({ id: entry.id, isFavorite: !entry.isFavorite }); }}
                    onMove={() => { if (!bulkMode) setMoveItem({ entry, card }); }}
                  />
                ))}
              </div>
            )}

            {/* List view */}
            {!collPending && displayEntries.length > 0 && viewMode === "list" && (
              <div className="space-y-1">
                {displayEntries.map(({ entry, card }) => (
                  <CollectionListRow
                    key={entry.id} entry={entry} card={card}
                    bulkMode={bulkMode}
                    selected={selectedIds.has(entry.id)}
                    onToggleSelect={() => toggleSelect(entry.id)}
                    onEdit={() => { if (!bulkMode) setEditItem({ entry, card }); }}
                    onDelete={() => { if (!bulkMode) deleteMutation.mutate(entry.id); }}
                    onFavorite={() => { if (!bulkMode) favoriteMutation.mutate({ id: entry.id, isFavorite: !entry.isFavorite }); }}
                    onMove={() => { if (!bulkMode) setMoveItem({ entry, card }); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drag overlay (grid view only) */}
      <DragOverlay>
        {draggingEntry && viewMode === "grid" && (
          <div className="w-36 rounded-2xl border border-accent/40 bg-surface shadow-2xl opacity-90 overflow-hidden">
            <div className="relative aspect-[3/4] overflow-hidden">
              <CardImage url={draggingEntry.card.imageUrl} name={draggingEntry.card.name} className="h-full w-full" />
            </div>
            <p className="truncate px-3 py-2 text-xs font-semibold text-[#F2F2F2]">{draggingEntry.card.name}</p>
          </div>
        )}
      </DragOverlay>

      {/* Bulk action bar (fixed bottom) */}
      {bulkMode && (
        <BulkActionBar
          selectedIds={selectedIds}
          folders={folders}
          onClose={exitBulkMode}
          onDeleted={refetchAll}
          onMoved={refetchAll}
        />
      )}

      {/* Dialogs */}
      <AddCardDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={refetchAll} />
      <EditDialog item={editItem} onClose={() => setEditItem(null)} onSaved={refetchAll} />
      <MoveFolderDialog entry={moveItem} folders={folders} onClose={() => setMoveItem(null)} onMoved={refetchAll} />
      <FolderDialog state={folderDialog} onClose={() => setFolderDialog(null)} onSaved={refetchAll} />
      <ConfirmDeleteFolderDialog folder={deleteFolder} onClose={() => setDeleteFolder(null)} onConfirm={confirmDeleteFolder} />
    </DndContext>
  );
}
