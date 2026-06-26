"use client";

import { useState, useEffect } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { ChatView } from "@/components/ChatView";

interface ConvEntry {
  id:            string;
  listingId:     string | null;
  listingCard:   string | null;
  lastMessageAt: string | null;
  unread:        number;
  other:         { id: string; name: string; displayName: string | null; image: string | null } | null;
  lastMessage:   { body: string; senderId: string; sentAt: string } | null;
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m  = Math.floor(ms / 60_000);
  const h  = Math.floor(m / 60);
  const d  = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return "now";
}

export default function MessagesPage() {
  const [convs, setConvs]       = useState<ConvEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => setConvs(d.conversations ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* ── Main layout ── */}
      <div className="flex h-[calc(100vh-3.5rem)] divide-x divide-white/10">

        {/* Conversation list */}
        <div className="flex w-full flex-col lg:w-80 xl:w-96">
          <div className="border-b border-white/10 px-5 py-4">
            <h1 className="text-lg font-bold text-[#F2F2F2]">Messages</h1>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-px p-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl p-3">
                    <div className="size-11 shrink-0 animate-pulse rounded-full bg-surface2" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-surface2" />
                      <div className="h-2.5 w-3/4 animate-pulse rounded bg-surface2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : convs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-24 text-center">
                <ChatBubbleLeftRightIcon className="size-10 text-[#9A9A9A]" />
                <p className="font-semibold text-[#F2F2F2]">No messages yet</p>
                <p className="text-sm text-[#9A9A9A]">Start a conversation from any listing.</p>
                <Link href="/marketplace" className="mt-1 text-sm text-accent hover:underline">Browse marketplace</Link>
              </div>
            ) : (
              <div className="space-y-px p-2">
                {convs.map((c) => {
                  const name   = c.other?.displayName ?? c.other?.name ?? "Unknown";
                  const active = activeId === c.id;

                  const inner = (
                    <div className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                      active ? "bg-white/8" : "hover:bg-white/5"
                    }`}>
                      {/* Avatar */}
                      {c.other?.image ? (
                        <img src={c.other.image} alt={name} className="size-11 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface2 text-sm font-bold text-[#9A9A9A]">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className={`truncate text-sm font-semibold ${c.unread > 0 ? "text-[#F2F2F2]" : "text-[#CACACA]"}`}>{name}</p>
                          {c.lastMessageAt && (
                            <span className="shrink-0 text-[10px] text-[#9A9A9A]">{timeAgo(c.lastMessageAt)}</span>
                          )}
                        </div>
                        {c.listingCard && (
                          <p className="truncate text-[10px] text-accent">re: {c.listingCard}</p>
                        )}
                        {c.lastMessage && (
                          <p className={`mt-0.5 truncate text-xs ${c.unread > 0 ? "font-medium text-[#F2F2F2]" : "text-[#9A9A9A]"}`}>
                            {c.lastMessage.body}
                          </p>
                        )}
                      </div>

                      {/* Unread badge */}
                      {c.unread > 0 && (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                          {c.unread > 9 ? "9+" : c.unread}
                        </span>
                      )}
                    </div>
                  );

                  return (
                    <div key={c.id}>
                      {/* On mobile: open modal; on desktop: set active panel */}
                      <button
                        className="w-full text-left lg:hidden"
                        onClick={() => setActiveId(c.id)}
                      >
                        {inner}
                      </button>
                      <button
                        className="hidden w-full text-left lg:block"
                        onClick={() => setActiveId(c.id)}
                      >
                        {inner}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Desktop: split-panel chat */}
        <div className="hidden flex-1 lg:flex lg:flex-col">
          {activeId ? (
            <ChatView convId={activeId} onBack={() => setActiveId(null)} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <ChatBubbleLeftRightIcon className="size-12 text-[#9A9A9A]/40" />
              <p className="text-sm text-[#9A9A9A]">Select a conversation</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: full-screen slide-up chat overlay */}
      <div
        className={`fixed inset-0 z-[10000] bg-[#111111] transition-transform duration-300 ease-in-out lg:hidden ${
          activeId ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {activeId && <ChatView convId={activeId} onBack={() => setActiveId(null)} />}
      </div>
    </>
  );
}
