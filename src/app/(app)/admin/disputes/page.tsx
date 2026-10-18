"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface PartyInfo {
  id:              string;
  name:            string;
  displayName:     string | null;
  email:           string;
  noShowCount:     number;
  reputationScore: number;
}

interface DisputeRow {
  id:          string;
  status:      "no_show" | "disputed";
  agreedPrice: string;
  resolvedAt:  string | null;
  adminNote:   string | null;
  createdAt:   string;
  updatedAt:   string;
  card:        { name: string; imageUrl: string | null };
  buyer:       PartyInfo | null;
  seller:      PartyInfo | null;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Party({ p, label }: { p: PartyInfo | null; label: string }) {
  if (!p) return <div className="text-xs text-[#9A9A9A]">{label}: unknown</div>;
  return (
    <div className="text-xs">
      <span className="text-[#9A9A9A]">{label}: </span>
      <Link href={`/admin/users/${p.id}`} className="font-semibold text-accent hover:underline">
        {p.displayName ?? p.name}
      </Link>
      <span className="ml-2 text-[#9A9A9A]">
        rep {p.reputationScore} · {p.noShowCount} no-show{p.noShowCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

export default function AdminDisputesPage() {
  const [rows, setRows]       = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [notes, setNotes]     = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/disputes");
    const data = await res.json();
    if (res.ok) setRows(data.disputes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function resolve(id: string, action: "seller_fault" | "buyer_fault" | "no_fault") {
    setWorking(id);
    await fetch(`/api/admin/disputes/${id}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, note: notes[id] }),
    });
    setWorking(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ExclamationTriangleIcon className="size-6 text-yellow-400" />
        <h1 className="text-2xl font-bold text-[#F2F2F2]">Dispute Queue</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-xs font-bold text-yellow-400">
            {rows.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-surface p-12 text-center">
          <CheckCircleIcon className="mx-auto mb-3 size-10 text-bid" />
          <p className="font-semibold text-[#F2F2F2]">No open disputes</p>
          <p className="mt-1 text-sm text-[#9A9A9A]">All transactions are in good shape.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-surface p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-bold uppercase ${
                    r.status === "disputed" ? "bg-red-400/10 text-red-400" : "bg-yellow-400/10 text-yellow-400"
                  }`}>
                    {r.status.replace("_", " ")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#F2F2F2]">{r.card.name}</p>
                    <p className="text-xs text-[#9A9A9A]">
                      ₱{parseFloat(r.agreedPrice).toLocaleString("en-PH")} · {timeAgo(r.updatedAt)}
                    </p>
                  </div>
                </div>
                <Link href={`/transactions/${r.id}`}
                  className="shrink-0 text-xs text-accent hover:underline">
                  View txn →
                </Link>
              </div>

              {/* Parties */}
              <div className="space-y-1">
                <Party p={r.buyer}  label="Buyer"  />
                <Party p={r.seller} label="Seller" />
              </div>

              {/* Resolution */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/8">
                <input
                  type="text"
                  placeholder="Admin note (optional)"
                  value={notes[r.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-surface2 px-3 py-1.5 text-xs text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
                />
                <button onClick={() => resolve(r.id, "seller_fault")} disabled={working === r.id}
                  className="rounded-lg bg-red-400/10 border border-red-400/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-400/20 disabled:opacity-50">
                  Seller at fault
                </button>
                <button onClick={() => resolve(r.id, "buyer_fault")} disabled={working === r.id}
                  className="rounded-lg bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 text-xs font-medium text-yellow-400 transition hover:bg-yellow-400/20 disabled:opacity-50">
                  Buyer at fault
                </button>
                <button onClick={() => resolve(r.id, "no_fault")} disabled={working === r.id}
                  className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-medium text-[#9A9A9A] transition hover:text-[#F2F2F2] disabled:opacity-50">
                  No fault
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
