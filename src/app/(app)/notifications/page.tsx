"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CheckIcon } from "@heroicons/react/24/outline";

type NotifType =
  | "offer_received" | "offer_accepted" | "offer_declined" | "offer_countered"
  | "auction_won" | "auction_outbid"
  | "transaction_agreed" | "transaction_completed"
  | "message_received" | "wishlist_match" | "system";

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
  offer_received:        "💰",
  offer_accepted:        "✅",
  offer_declined:        "❌",
  offer_countered:       "↩️",
  auction_won:           "🏆",
  auction_outbid:        "⚡",
  transaction_agreed:    "🤝",
  transaction_completed: "⭐",
  message_received:      "💬",
  wishlist_match:        "🎯",
  system:                "📢",
};

function groupByDate(items: NotifEntry[]): { label: string; items: NotifEntry[] }[] {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yest  = today - 86400_000;
  const week  = today - 6 * 86400_000;

  const buckets: Record<string, NotifEntry[]> = {
    Today:       [],
    Yesterday:   [],
    "This week": [],
    Older:       [],
  };

  for (const n of items) {
    const t = new Date(n.createdAt).getTime();
    if (t >= today)     buckets["Today"].push(n);
    else if (t >= yest) buckets["Yesterday"].push(n);
    else if (t >= week) buckets["This week"].push(n);
    else                buckets["Older"].push(n);
  }

  return Object.entries(buckets)
    .filter(([, v]) => v.length > 0)
    .map(([label, items]) => ({ label, items }));
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifs, setNotifs]           = useState<NotifEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [markingAll, setMarkingAll]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/notifications");
    const data = await res.json();
    if (res.ok) {
      setNotifs(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(n: NotifEntry) {
    if (!n.readAt) {
      await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.link) router.push(n.link);
  }

  async function markAllRead() {
    setMarkingAll(true);
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    setNotifs((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    setMarkingAll(false);
  }

  const groups = groupByDate(notifs);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8 lg:px-10 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellIcon className="size-5 text-[#9A9A9A]" />
          <h1 className="text-xl font-bold text-[#F2F2F2]">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-sm font-normal text-accent">({unreadCount} unread)</span>
            )}
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-50"
          >
            <CheckIcon className="size-3.5" />
            {markingAll ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface" />
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-16 text-center">
          <BellIcon className="mx-auto mb-3 size-10 text-white/10" />
          <p className="text-sm text-[#9A9A9A]">You have no notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9A9A9A]">
                {label}
              </p>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface divide-y divide-white/5">
                {items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-surface2 ${
                      !n.readAt ? "bg-accent/5" : ""
                    }`}
                  >
                    <span className="mt-0.5 shrink-0 text-lg leading-none">
                      {TYPE_ICON[n.type] ?? "📢"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold leading-snug ${!n.readAt ? "text-[#F2F2F2]" : "text-[#9A9A9A]"}`}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[#9A9A9A] line-clamp-2">{n.body}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[10px] text-white/30 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                      {!n.readAt && <span className="size-2 rounded-full bg-accent" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
