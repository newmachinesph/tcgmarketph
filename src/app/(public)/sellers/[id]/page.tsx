"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  StarIcon,
  ShieldCheckIcon,
  MapPinIcon,
  ChatBubbleLeftEllipsisIcon,
  TagIcon,
  CalendarDaysIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { ReportButton } from "@/components/ReportButton";

interface SellerProfile {
  id:               string;
  name:             string;
  displayName:      string | null;
  username:         string | null;
  collectionPublic: boolean;
  image:            string | null;
  city:             string | null;
  bio:              string | null;
  phoneVerified:    boolean;
  reputationScore:  number;
  noShowCount:      number;
  isBanned:         boolean;
  createdAt:        string;
  avgScore:         string | null;
  ratingCount:      number;
  completedDeals:   number;
}

interface ListingCard {
  id:         string;
  slug:       string | null;
  price:      string;
  condition:  string;
  isGraded:   boolean;
  coverPhoto: string | null;
  card: { name: string; setName: string | null; game: string; imageUrl: string | null };
}

interface RatingEntry {
  id:        string;
  score:     number;
  comment:   string | null;
  createdAt: string;
  rater: { id: string; name: string; displayName: string | null; image: string | null };
}

function Stars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarSolid
          key={n}
          className={`size-3.5 ${n <= score ? "text-yellow-400" : "text-white/20"}`}
        />
      ))}
    </div>
  );
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", year: "numeric" });
}

export default function SellerProfilePage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [seller, setSeller]     = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [ratings, setRatings]   = useState<RatingEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [hasMore, setHasMore]   = useState(false);
  const [page, setPage]         = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Inline message compose panel
  const [msgOpen, setMsgOpen]     = useState(false);
  const [msgText, setMsgText]     = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async (pg: number, append: boolean) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    const res  = await fetch(`/api/sellers/${id}?page=${pg}`);
    const data = await res.json();
    if (res.ok) {
      setSeller(data.seller);
      setListings((prev) => append ? [...prev, ...data.listings] : data.listings);
      if (!append) setRatings(data.ratings ?? []);
      setHasMore(data.hasMore);
      setPage(pg);
    }
    setLoading(false);
    setLoadingMore(false);
  }, [id]);

  useEffect(() => { load(1, false); }, [load]);

  function openMsgPanel() {
    setMsgOpen(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  async function sendMessage() {
    if (!msgText.trim() || msgSending) return;
    setMsgSending(true);
    try {
      // Get or create conversation
      const convRes  = await fetch("/api/conversations", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ recipientId: id }),
      });
      const convData = await convRes.json();
      if (!convRes.ok) { setMsgSending(false); return; }

      const convId = convData.conversation.id;

      // Send the message
      const msgRes = await fetch(`/api/conversations/${convId}/messages`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ body: msgText.trim() }),
      });
      if (!msgRes.ok) { setMsgSending(false); return; }

      router.push(`/messages/${convId}`);
    } catch {
      setMsgSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10 space-y-6">
        <div className="h-28 animate-pulse rounded-2xl bg-surface" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface" />)}
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-20 text-center">
        <p className="text-sm text-[#9A9A9A]">Seller not found.</p>
      </div>
    );
  }

  const displayName = seller.displayName ?? seller.name;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-10 space-y-8">

      {/* Back */}
      <Link
        href="/sellers"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A9A9A] transition hover:text-[#F2F2F2]"
      >
        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Sellers
      </Link>

      {/* Inline message compose panel */}
      {msgOpen && (
        <div className="rounded-2xl border border-accent/30 bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#F2F2F2]">
              Message {seller?.displayName ?? seller?.name}
            </p>
            <button
              onClick={() => { setMsgOpen(false); setMsgText(""); }}
              className="text-[#9A9A9A] hover:text-[#F2F2F2] transition"
            >
              <XMarkIcon className="size-4" />
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendMessage(); }}
            rows={3}
            placeholder="Hi, is this still available?"
            className="w-full resize-none rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder-white/30 outline-none focus:border-accent/50"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] text-[#9A9A9A]">⌘ Enter to send</p>
            <button
              onClick={sendMessage}
              disabled={!msgText.trim() || msgSending}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/80 disabled:opacity-40"
            >
              <PaperAirplaneIcon className="size-4" />
              {msgSending ? "Sending…" : "Send & open chat"}
            </button>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="rounded-2xl border border-white/10 bg-surface p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
          {seller.image ? (
            <Image src={seller.image} alt={displayName} width={80} height={80} className="size-20 rounded-full object-cover shrink-0" />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-surface2 text-2xl font-bold text-[#9A9A9A]">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-[#F2F2F2]">{displayName}</h1>
              {seller.phoneVerified && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-600/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  <ShieldCheckIcon className="size-3" /> Verified
                </span>
              )}
              {seller.isBanned && (
                <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-bold text-red-400">
                  Suspended
                </span>
              )}
            </div>

            {seller.city && (
              <p className="mt-1 flex items-center gap-1 text-xs text-[#9A9A9A]">
                <MapPinIcon className="size-3.5" /> {seller.city}
              </p>
            )}
            <p className="mt-1 flex items-center gap-1 text-xs text-[#9A9A9A]">
              <CalendarDaysIcon className="size-3.5" />
              Member since {new Date(seller.createdAt).toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
            </p>

            {seller.bio && (
              <p className="mt-2 text-sm text-[#9A9A9A] whitespace-pre-wrap">{seller.bio}</p>
            )}

            {/* Stats row */}
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div className="text-center">
                <p className="text-lg font-bold text-[#F2F2F2]">{seller.completedDeals}</p>
                <p className="text-[10px] uppercase tracking-wider text-[#9A9A9A]">Deals</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#F2F2F2]">
                  {seller.avgScore ? `${seller.avgScore} ★` : "—"}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[#9A9A9A]">
                  Avg rating{seller.ratingCount > 0 ? ` (${seller.ratingCount})` : ""}
                </p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${seller.noShowCount > 0 ? "text-red-400" : "text-[#F2F2F2]"}`}>
                  {seller.noShowCount}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-[#9A9A9A]">No-shows</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={openMsgPanel}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition ${
                msgOpen ? "bg-accent/70 ring-1 ring-accent" : "bg-accent hover:bg-accent/80"
              }`}
            >
              <ChatBubbleLeftEllipsisIcon className="size-4" />
              Message
            </button>
            {seller.collectionPublic && (
              <Link
                href={`/sellers/${id}/collection`}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-[#F2F2F2] transition hover:border-white/20"
              >
                <RectangleStackIcon className="size-4" />
                View Collection
              </Link>
            )}
            <div className="flex justify-end">
              <ReportButton targetType="user" targetId={id} label="Report seller" />
            </div>
          </div>
        </div>
      </div>

      {/* Active listings */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#F2F2F2]">
          <TagIcon className="size-4 text-[#9A9A9A]" />
          Active Listings
        </h2>

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
            <p className="text-sm text-[#9A9A9A]">No active listings.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {listings.map((l) => (
                <Link
                  key={l.id}
                  href={`/listings/${l.slug ?? l.id}`}
                  className="group rounded-2xl border border-white/10 bg-surface overflow-hidden transition hover:border-white/20"
                >
                  <div className="relative aspect-[3/4] bg-surface2 overflow-hidden">
                    {(() => {
                      const imgSrc = l.coverPhoto ?? l.card.imageUrl;
                      return imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={l.card.name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <TagIcon className="size-8 text-white/10" />
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-semibold text-[#F2F2F2]">{l.card.name}</p>
                    <p className="truncate text-[10px] text-[#9A9A9A]">{l.card.setName ?? "—"}</p>
                    <p className="mt-1 text-sm font-bold text-[#F2F2F2]">
                      ₱{parseFloat(l.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </Link>
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

      {/* Ratings */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#F2F2F2]">
          <StarIcon className="size-4 text-[#9A9A9A]" />
          Ratings ({seller.ratingCount})
        </h2>

        {ratings.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-surface p-8 text-center">
            <p className="text-sm text-[#9A9A9A]">No ratings yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ratings.map((r) => {
              const raterName = r.rater.displayName ?? r.rater.name;
              return (
                <div key={r.id} className="rounded-2xl border border-white/10 bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {r.rater.image ? (
                        <Image src={r.rater.image} alt={raterName} width={32} height={32} className="size-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface2 text-xs font-bold text-[#9A9A9A]">
                          {raterName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link href={`/sellers/${r.rater.id}`} className="text-sm font-medium text-[#F2F2F2] hover:underline">
                          {raterName}
                        </Link>
                        <div className="mt-0.5">
                          <Stars score={r.score} />
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#9A9A9A] shrink-0">{timeAgo(r.createdAt)}</span>
                  </div>
                  {r.comment && (
                    <p className="mt-2.5 text-sm text-[#9A9A9A] whitespace-pre-wrap">{r.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
