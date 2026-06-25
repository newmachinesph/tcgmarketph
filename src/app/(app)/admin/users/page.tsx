"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon, NoSymbolIcon, CheckBadgeIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface UserRow {
  id:              string;
  name:            string;
  displayName:     string | null;
  email:           string;
  image:           string | null;
  phoneVerified:   boolean;
  isBanned:        boolean;
  isAdmin:         boolean;
  reputationScore: number;
  noShowCount:     number;
  createdAt:       string;
}

export default function AdminUsersPage() {
  const [rows, setRows]         = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState("");
  const [banned, setBanned]     = useState<"" | "true" | "false">("");
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(false);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (search: string, bannedFilter: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (search)      params.set("q", search);
    if (bannedFilter) params.set("banned", bannedFilter);
    const res  = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    if (res.ok) {
      setRows(p === 1 ? data.users : (prev) => [...prev, ...data.users]);
      setHasMore(data.hasMore);
    }
    setLoading(false);
  }, []);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(q, banned, 1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, banned, load]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load(q, banned, next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[#F2F2F2]">Users</h1>
        <div className="flex items-center gap-2">
          {/* Ban filter */}
          <div className="flex rounded-lg border border-white/10 bg-surface overflow-hidden">
            {([["", "All"], ["false", "Active"], ["true", "Banned"]] as [string, string][]).map(([v, label]) => (
              <button key={v} onClick={() => setBanned(v as "" | "true" | "false")}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  banned === v ? "bg-accent text-white" : "text-[#9A9A9A] hover:text-[#F2F2F2]"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9A9A]" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-xl border border-white/10 bg-surface py-2.5 pl-9 pr-4 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_120px_80px_60px] gap-3 border-b border-white/10 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#9A9A9A]">
          <span>User</span>
          <span />
          <span>Joined</span>
          <span>Rep</span>
          <span>Flags</span>
        </div>

        {loading && rows.length === 0 ? (
          <div className="space-y-0 divide-y divide-white/5">
            {[1,2,3,4,5].map((i) => <div key={i} className="h-14 animate-pulse bg-surface" />)}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-[#9A9A9A]">No users found.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((u) => (
              <Link key={u.id} href={`/admin/users/${u.id}`}
                className="grid grid-cols-[auto_1fr_120px_80px_60px] items-center gap-3 px-5 py-3 transition hover:bg-surface2">
                {/* Avatar */}
                <div className="size-8 shrink-0 overflow-hidden rounded-full bg-surface2 flex items-center justify-center text-xs font-bold text-[#9A9A9A]">
                  {u.image
                    ? <img src={u.image} alt="" className="size-full object-cover" />
                    : (u.displayName ?? u.name).slice(0, 1).toUpperCase()
                  }
                </div>

                {/* Name + email */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="truncate text-sm font-semibold text-[#F2F2F2]">
                      {u.displayName ?? u.name}
                    </p>
                    {u.isAdmin && (
                      <span className="rounded bg-accent/20 px-1 py-0.5 text-[9px] font-bold text-accent">ADMIN</span>
                    )}
                    {u.phoneVerified && (
                      <CheckBadgeIcon className="size-3.5 shrink-0 text-bid" />
                    )}
                    {u.isBanned && (
                      <NoSymbolIcon className="size-3.5 shrink-0 text-red-400" />
                    )}
                    {u.noShowCount >= 3 && (
                      <span className="flex items-center gap-0.5 rounded bg-orange-500/20 px-1 py-0.5 text-[9px] font-bold text-orange-400">
                        <ExclamationTriangleIcon className="size-2.5" />
                        NO-SHOW ×{u.noShowCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-[#9A9A9A]">{u.email}</p>
                </div>

                {/* Joined */}
                <p className="text-xs text-[#9A9A9A]">
                  {new Date(u.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "2-digit" })}
                </p>

                {/* Rep */}
                <p className="text-xs font-semibold text-[#F2F2F2]">{u.reputationScore}</p>

                {/* No-shows */}
                <p className={`text-xs font-semibold ${u.noShowCount >= 3 ? "text-red-400" : u.noShowCount > 0 ? "text-yellow-400" : "text-[#9A9A9A]"}`}>
                  {u.noShowCount > 0 ? `${u.noShowCount} ⚠` : "—"}
                </p>
              </Link>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="border-t border-white/10 px-5 py-3">
            <button onClick={loadMore} disabled={loading}
              className="text-sm text-accent hover:underline disabled:opacity-50">
              {loading ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
