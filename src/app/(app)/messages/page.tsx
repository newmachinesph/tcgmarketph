"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

interface ConvEntry {
  id: string;
  listingId: string | null;
  listingCard: string | null;
  lastMessageAt: string | null;
  unread: number;
  other: { id: string; name: string; displayName: string | null; image: string | null } | null;
  lastMessage: { body: string; senderId: string; sentAt: string } | null;
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60_000);
  const h  = Math.floor(m / 60);
  const d  = Math.floor(h / 24);
  if (d > 0)  return `${d}d ago`;
  if (h > 0)  return `${h}h ago`;
  if (m > 0)  return `${m}m ago`;
  return "just now";
}

export default function MessagesPage() {
  const [convs, setConvs]       = useState<ConvEntry[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConvs(d.conversations ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 lg:px-10">
      <h1 className="mb-6 text-2xl font-bold text-[#F2F2F2]">Messages</h1>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      ) : convs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <ChatBubbleLeftRightIcon className="size-10 text-[#9A9A9A]" />
          <p className="font-semibold text-[#F2F2F2]">No messages yet</p>
          <p className="text-sm text-[#9A9A9A]">Start a conversation from any listing or transaction.</p>
          <Link href="/marketplace" className="mt-1 text-sm text-accent hover:underline">Browse marketplace</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {convs.map((c) => {
            const name = c.other?.displayName ?? c.other?.name ?? "Unknown";
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-surface p-4 transition hover:border-white/20"
              >
                {c.other?.image ? (
                  <img src={c.other.image} alt={name} className="size-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-[#9A9A9A]">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm font-semibold truncate ${c.unread > 0 ? "text-[#F2F2F2]" : "text-[#CACACA]"}`}>{name}</p>
                    {c.lastMessageAt && (
                      <p className="shrink-0 text-[10px] text-[#9A9A9A]">{timeAgo(c.lastMessageAt)}</p>
                    )}
                  </div>
                  {c.listingCard && (
                    <p className="text-[10px] text-accent truncate">re: {c.listingCard}</p>
                  )}
                  {c.lastMessage && (
                    <p className={`mt-0.5 text-xs truncate ${c.unread > 0 ? "text-[#F2F2F2]" : "text-[#9A9A9A]"}`}>
                      {c.lastMessage.body}
                    </p>
                  )}
                </div>

                {c.unread > 0 && (
                  <span className="shrink-0 flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                    {c.unread > 9 ? "9+" : c.unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
