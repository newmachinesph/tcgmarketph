"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeftIcon,
  LockClosedIcon,
  RectangleStackIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

type ConditionKey =
  | "near_mint"
  | "lightly_played"
  | "moderately_played"
  | "heavily_played"
  | "damaged";

const CONDITION_LABELS: Record<ConditionKey, string> = {
  near_mint:          "NM",
  lightly_played:     "LP",
  moderately_played:  "MP",
  heavily_played:     "HP",
  damaged:            "DMG",
};

const CONDITION_COLORS: Record<ConditionKey, string> = {
  near_mint:          "text-emerald-400",
  lightly_played:     "text-bid",
  moderately_played:  "text-yellow-400",
  heavily_played:     "text-orange-400",
  damaged:            "text-red-400",
};

interface CollectionItem {
  id:             string;
  quantity:       number;
  condition:      ConditionKey;
  gradingCompany: string;
  gradeValue:     string | null;
  isFoil:         boolean;
  isFirstEdition: boolean;
  language:       string;
  isFavorite:     boolean;
  card: {
    id:       string;
    name:     string;
    setName:  string | null;
    game:     string;
    rarity:   string | null;
    imageUrl: string | null;
  };
}

interface SellerInfo {
  id:          string;
  name:        string;
  displayName: string | null;
  username:    string | null;
}

function ConditionBadge({ condition }: { condition: ConditionKey }) {
  return (
    <span className={`text-[10px] font-bold ${CONDITION_COLORS[condition] ?? "text-[#9A9A9A]"}`}>
      {CONDITION_LABELS[condition] ?? condition}
    </span>
  );
}

function ItemCard({ item }: { item: CollectionItem }) {
  const graded = item.gradingCompany !== "none" && item.gradeValue;
  const label  = graded
    ? `${item.gradingCompany.toUpperCase()} ${item.gradeValue}`
    : null;

  return (
    <div className="group overflow-hidden rounded-2xl border border-white/10 bg-surface transition hover:border-white/20">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface2">
        {item.card.imageUrl ? (
          <Image
            src={item.card.imageUrl}
            alt={item.card.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <RectangleStackIcon className="size-8 text-white/10" />
          </div>
        )}
        {item.isFavorite && (
          <div className="absolute right-2 top-2">
            <StarSolid className="size-4 text-yellow-400 drop-shadow" />
          </div>
        )}
        {item.quantity > 1 && (
          <div className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
            ×{item.quantity}
          </div>
        )}
      </div>

      <div className="p-3 space-y-1">
        <p className="truncate text-xs font-semibold text-[#F2F2F2]">{item.card.name}</p>
        <p className="truncate text-[10px] text-[#9A9A9A]">{item.card.setName ?? "—"}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {label ? (
            <span className="rounded bg-yellow-400/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-300">
              {label}
            </span>
          ) : (
            <ConditionBadge condition={item.condition} />
          )}
          {item.isFoil && (
            <span className="rounded bg-purple-400/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
              Foil
            </span>
          )}
          {item.isFirstEdition && (
            <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
              1st Ed
            </span>
          )}
          {item.language !== "en" && (
            <span className="rounded bg-surface2 px-1.5 py-0.5 text-[10px] font-medium text-[#9A9A9A] uppercase">
              {item.language}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PublicCollectionPage() {
  const { id } = useParams<{ id: string }>();

  const [seller, setSeller]     = useState<SellerInfo | null>(null);
  const [items, setItems]       = useState<CollectionItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [hasMore, setHasMore]   = useState(false);
  const [page, setPage]         = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPrivate, setIsPrivate]     = useState(false);

  const load = useCallback(async (pg: number, append: boolean) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const res = await fetch(`/api/sellers/${id}/collection?page=${pg}`);
    if (res.status === 403) {
      setIsPrivate(true);
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    const data = await res.json();
    if (res.ok) {
      setSeller(data.seller);
      setItems((prev) => append ? [...prev, ...data.items] : data.items);
      setHasMore(data.hasMore);
      setPage(pg);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [id]);

  useEffect(() => { load(1, false); }, [load]);

  const displayName = seller?.displayName ?? seller?.name ?? "Seller";

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10 space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-20 text-center space-y-4">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-surface">
          <LockClosedIcon className="size-7 text-[#9A9A9A]" />
        </div>
        <h1 className="text-xl font-bold text-[#F2F2F2]">Collection is private</h1>
        <p className="text-sm text-[#9A9A9A]">This seller hasn&apos;t made their collection public yet.</p>
        <Link
          href={`/sellers/${id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-[#F2F2F2] transition hover:border-white/20"
        >
          <ArrowLeftIcon className="size-4" /> View seller profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10 space-y-8">

      {/* Back */}
      <Link
        href={`/sellers/${id}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A9A9A] transition hover:text-[#F2F2F2]"
      >
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to profile
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <RectangleStackIcon className="size-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F2F2F2]">{displayName}&apos;s Collection</h1>
            <p className="text-xs text-[#9A9A9A]">{items.length + (hasMore ? "+" : "")} cards</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-12 text-center">
          <RectangleStackIcon className="mx-auto mb-3 size-10 text-white/10" />
          <p className="text-sm text-[#9A9A9A]">No cards in collection yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => load(page + 1, true)}
                disabled={loadingMore}
                className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-50"
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
