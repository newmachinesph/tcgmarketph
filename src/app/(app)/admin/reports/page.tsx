"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FlagIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  UserIcon,
  TagIcon,
  ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

interface ReportEntry {
  id:         string;
  targetType: "user" | "listing" | "message";
  targetId:   string;
  reason:     string;
  details:    string | null;
  status:     ReportStatus;
  createdAt:  string;
  reporter:   { id: string; name: string; displayName: string | null; email: string } | null;
  resolver:   { id: string; name: string; displayName: string | null } | null;
}

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "Open",       value: "open"      },
  { label: "Reviewing",  value: "reviewing" },
  { label: "Resolved",   value: "resolved"  },
  { label: "Dismissed",  value: "dismissed" },
];

const TARGET_ICON = {
  user:    UserIcon,
  listing: TagIcon,
  message: ChatBubbleLeftEllipsisIcon,
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AdminReportsPage() {
  const [tab, setTab]         = useState<string>("open");
  const [rows, setRows]       = useState<ReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [note, setNote]       = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch(`/api/admin/reports?status=${tab}`);
    const data = await res.json();
    if (res.ok) setRows(data.reports ?? []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: "reviewing" | "resolved" | "dismissed") {
    setWorking(id);
    await fetch(`/api/admin/reports/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status, note: note[id] }),
    });
    setWorking(null);
    load();
  }

  const TargetLink = ({ type, id }: { type: string; id: string }) => {
    const href =
      type === "user"    ? `/admin/users/${id}` :
      type === "listing" ? `/listings/${id}`     :
      `/messages`;
    return (
      <Link href={href} className="font-mono text-xs text-accent hover:underline">
        {type}/{id.slice(0, 8)}…
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center gap-3">
        <FlagIcon className="size-6 text-accent" />
        <h1 className="text-2xl font-bold text-[#F2F2F2]">Reports Queue</h1>
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-2 border-b border-white/10 pb-0">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t.value
                ? "border-accent text-[#F2F2F2]"
                : "border-transparent text-[#9A9A9A] hover:text-[#F2F2F2]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-10 text-center">
          <FlagIcon className="mx-auto mb-3 size-10 text-[#9A9A9A]" />
          <p className="text-sm text-[#9A9A9A]">No {tab} reports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const Icon = TARGET_ICON[r.targetType];
            return (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-surface p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0 text-[#9A9A9A]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#9A9A9A]">
                      {r.targetType}
                    </span>
                    <TargetLink type={r.targetType} id={r.targetId} />
                  </div>
                  <span className="shrink-0 text-[11px] text-[#9A9A9A]">{timeAgo(r.createdAt)}</span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-[#F2F2F2]">{r.reason}</p>
                  {r.details && <p className="mt-1 text-xs text-[#9A9A9A] whitespace-pre-wrap">{r.details}</p>}
                </div>

                <div className="text-xs text-[#9A9A9A]">
                  Reported by{" "}
                  <Link href={`/admin/users/${r.reporter?.id}`} className="text-accent hover:underline">
                    {r.reporter?.displayName ?? r.reporter?.name ?? "unknown"}
                  </Link>
                  {r.resolver && (
                    <> · Resolved by <span className="text-[#F2F2F2]">
                      {r.resolver.displayName ?? r.resolver.name}
                    </span></>
                  )}
                </div>

                {/* Actions */}
                {(tab === "open" || tab === "reviewing") && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Admin note (optional)"
                      value={note[r.id] ?? ""}
                      onChange={(e) => setNote((n) => ({ ...n, [r.id]: e.target.value }))}
                      className="flex-1 min-w-[180px] rounded-lg border border-white/10 bg-surface2 px-3 py-1.5 text-xs text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
                    />
                    {tab === "open" && (
                      <button
                        onClick={() => updateStatus(r.id, "reviewing")}
                        disabled={working === r.id}
                        className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-50"
                      >
                        <EyeIcon className="size-3.5" /> Review
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(r.id, "resolved")}
                      disabled={working === r.id}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600/20 border border-emerald-600/30 px-3 py-1.5 text-xs text-emerald-400 transition hover:bg-emerald-600/30 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="size-3.5" /> Resolve
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "dismissed")}
                      disabled={working === r.id}
                      className="flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-[#9A9A9A] transition hover:text-[#F2F2F2] disabled:opacity-50"
                    >
                      <XCircleIcon className="size-3.5" /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
