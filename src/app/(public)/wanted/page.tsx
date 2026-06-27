"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";
import { GAME_LABEL } from "@/lib/constants/games";
import { CONDITION_LABEL } from "@/lib/validations/listing";

interface WantedItem {
  id:          string;
  game:        string;
  cardName:    string;
  setName:     string | null;
  condition:   string;
  maxPricePHP: string | null;
  negotiable:  boolean;
  notes:       string | null;
  status:      string;
  expiresAt:   string;
  createdAt:   string;
  poster: { name: string; image: string | null; city: string | null };
}

function timeLeft(iso: string) {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return days <= 1 ? "Expires tomorrow" : `${days}d left`;
}

function ConditionBadge({ value }: { value: string }) {
  if (value === "any") return <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[#9A9A9A]">Any condition</span>;
  const parts = value.split(",").map((c) => CONDITION_LABEL[c.trim()] ?? c.trim());
  return (
    <>
      {parts.map((p) => (
        <span key={p} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[#9A9A9A]">{p}</span>
      ))}
    </>
  );
}

export default function WantedPage() {
  const { data: session } = authClient.useSession();
  const [items, setItems]     = useState<WantedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [game, setGame]       = useState("all");
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (g: string, p: number, append: boolean) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (g !== "all") params.set("game", g);
    const res  = await fetch(`/api/wanted?${params}`);
    const data = await res.json();
    setItems((prev) => append ? [...prev, ...data.items] : data.items);
    setHasMore(data.hasMore);
    setLoading(false);
  }, []);

  useEffect(() => {
    setPage(1);
    load(game, 1, false);
  }, [game, load]);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-10">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">Wanted</h1>
          <p className="mt-1 text-sm text-[#9A9A9A]">
            Cards collectors are looking for — respond if you have what they need.
          </p>
        </div>
        {session ? (
          <Link
            href="/wanted/new"
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            <PlusIcon className="size-4" /> Post Request
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20"
          >
            Sign in to post
          </Link>
        )}
      </div>

      {/* Game filter */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { value: "all",      label: "All games" },
          { value: "pokemon",  label: "Pokémon"   },
          { value: "one_piece", label: "One Piece" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setGame(value)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
              game === value
                ? "bg-accent text-white"
                : "border border-white/10 text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading && items.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1,2,3,4].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-surface py-24 text-center">
          <TagIcon className="mb-3 size-10 text-white/20" />
          <p className="font-semibold text-[#F2F2F2]">No open requests</p>
          <p className="mt-1 text-sm text-[#9A9A9A]">Be the first to post what you're looking for.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/wanted/${item.id}`}
              className="group flex flex-col rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-white/20"
            >
              {/* Game chip + expiry */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  {item.game === "any" ? "Any game" : (GAME_LABEL[item.game] ?? item.game)}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#9A9A9A]">
                  <ClockIcon className="size-3" /> {timeLeft(item.expiresAt)}
                </span>
              </div>

              {/* Card name */}
              <p className="text-base font-semibold text-[#F2F2F2] group-hover:text-white">
                {item.cardName}
              </p>
              {item.setName && (
                <p className="mt-0.5 text-xs text-[#9A9A9A]">{item.setName}</p>
              )}

              {/* Conditions */}
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <ConditionBadge value={item.condition} />
              </div>

              {/* Budget */}
              <div className="mt-3 flex items-center gap-1.5 text-sm">
                <CurrencyDollarIcon className="size-4 text-[#9A9A9A]" />
                {item.maxPricePHP ? (
                  <span className="font-semibold text-[#F2F2F2]">
                    Up to ₱{parseFloat(item.maxPricePHP).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    {item.negotiable && <span className="ml-1 text-xs font-normal text-[#9A9A9A]">(negotiable)</span>}
                  </span>
                ) : (
                  <span className="text-[#9A9A9A]">{item.negotiable ? "Price negotiable" : "Price not specified"}</span>
                )}
              </div>

              {/* Notes */}
              {item.notes && (
                <p className="mt-2 line-clamp-2 text-xs text-[#9A9A9A]">{item.notes}</p>
              )}

              {/* Poster */}
              <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3">
                {item.poster.image ? (
                  <Image src={item.poster.image} alt={item.poster.name} width={20} height={20} className="size-5 rounded-full object-cover" />
                ) : (
                  <div className="flex size-5 items-center justify-center rounded-full bg-surface2 text-[10px] font-bold text-[#9A9A9A]">
                    {item.poster.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-[#9A9A9A]">{item.poster.name}</span>
                {item.poster.city && <span className="text-xs text-[#9A9A9A]">· {item.poster.city}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="mt-6 text-center">
          <button
            onClick={() => { const next = page + 1; setPage(next); load(game, next, true); }}
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
          >
            Load more
          </button>
        </div>
      )}

      {loading && items.length > 0 && (
        <div className="mt-6 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}
    </div>
  );
}
