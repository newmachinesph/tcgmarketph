"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";
import Ably from "ably";
import { authClient } from "@/lib/auth-client";

type NotifType =
  | "offer_received" | "offer_accepted" | "offer_declined" | "offer_countered"
  | "auction_won" | "auction_outbid"
  | "transaction_agreed" | "transaction_completed"
  | "message_received" | "system";

interface NotifEntry {
  id:        string;
  type:      NotifType;
  title:     string;
  body:      string;
  link:      string | null;
  readAt:    string | null;
  createdAt: string;
}

const TYPE_ICON: Record<NotifType, string> = {
  offer_received:       "💰",
  offer_accepted:       "✅",
  offer_declined:       "❌",
  offer_countered:      "↩️",
  auction_won:          "🏆",
  auction_outbid:       "⚡",
  transaction_agreed:   "🤝",
  transaction_completed:"⭐",
  message_received:     "💬",
  system:               "📢",
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationsBell() {
  const router                          = useRouter();
  const { data: session }               = authClient.useSession();
  const uid                             = session?.user.id ?? "";

  const [open, setOpen]                 = useState(false);
  const [notifs, setNotifs]             = useState<NotifEntry[]>([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [markingAll, setMarkingAll]     = useState(false);
  const ref                             = useRef<HTMLDivElement>(null);

  const fetch_ = useCallback(async () => {
    if (!uid) return;
    const res  = await fetch("/api/notifications");
    const data = await res.json();
    if (res.ok) {
      setNotifs(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    }
  }, [uid]);

  // Poll every 60 s
  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, 60_000);
    return () => clearInterval(t);
  }, [fetch_]);

  // Ably real-time
  useEffect(() => {
    if (!uid || !process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY) return;
    const client  = new Ably.Realtime({ key: process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY });
    const channel = client.channels.get(`notifications:${uid}`);
    channel.subscribe("notification", () => { fetch_(); });
    return () => { client.close(); };
  }, [uid, fetch_]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markRead(notif: NotifEntry) {
    if (!notif.readAt) {
      await fetch(`/api/notifications/${notif.id}/read`, { method: "PATCH" });
      setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.link) {
      setOpen(false);
      router.push(notif.link);
    }
  }

  async function markAllRead() {
    setMarkingAll(true);
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifs((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    setMarkingAll(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-9 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
        aria-label="Notifications"
      >
        <BellIcon className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-2xl border border-white/10 bg-surface shadow-xl shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-[#F2F2F2]">
              Notifications {unreadCount > 0 && <span className="text-accent">({unreadCount})</span>}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                className="flex items-center gap-1 text-[11px] text-[#9A9A9A] transition hover:text-[#F2F2F2] disabled:opacity-50"
              >
                <CheckIcon className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <BellIcon className="mx-auto mb-2 size-8 text-white/10" />
                <p className="text-xs text-[#9A9A9A]">No notifications yet.</p>
              </div>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-surface2 ${
                    !n.readAt ? "bg-accent/5" : ""
                  }`}
                >
                  <span className="mt-0.5 text-base shrink-0">{TYPE_ICON[n.type] ?? "📢"}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold ${!n.readAt ? "text-[#F2F2F2]" : "text-[#9A9A9A]"}`}>
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#9A9A9A] line-clamp-2">{n.body}</p>
                    <p className="mt-0.5 text-[10px] text-white/30">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.readAt && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
