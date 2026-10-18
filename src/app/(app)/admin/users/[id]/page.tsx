"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  FlagIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

interface UserDetail {
  id:              string;
  name:            string;
  displayName:     string | null;
  email:           string;
  image:           string | null;
  isBanned:        boolean;
  bannedReason:    string | null;
  isAdmin:         boolean;
  reputationScore: number;
  noShowCount:     number;
  phoneVerified:   boolean;
  createdAt:       string;
}

interface TxnRow {
  id:        string;
  status:    string;
  buyerId:   string;
  sellerId:  string;
  createdAt: string;
}

interface ReportRow {
  id:         string;
  reason:     string;
  status:     string;
  createdAt:  string;
}

export default function AdminUserDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const [profile, setProfile]   = useState<UserDetail | null>(null);
  const [txns, setTxns]         = useState<TxnRow[]>([]);
  const [reports, setReports]   = useState<ReportRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [banReason, setBanReason] = useState("");
  const [working, setWorking]   = useState(false);
  const [error, setError]       = useState("");

  const load = useCallback(async () => {
    const res  = await fetch(`/api/admin/users/${id}`);
    if (res.status === 403) { router.push("/dashboard"); return; }
    const data = await res.json();
    if (res.ok) {
      setProfile(data.user);
      setTxns(data.transactions ?? []);
      setReports(data.reports ?? []);
    }
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  async function toggleBan() {
    if (!profile) return;
    if (!profile.isBanned && !banReason.trim()) {
      setError("Please enter a ban reason.");
      return;
    }
    setWorking(true);
    setError("");
    const res = await fetch(`/api/admin/users/${id}/ban`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ban: !profile.isBanned, reason: banReason }),
    });
    if (res.ok) {
      setBanReason("");
      await load();
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed");
    }
    setWorking(false);
  }

  async function takedownListing(listingId: string) {
    const reason = window.prompt("Reason for takedown:");
    if (!reason) return;
    await fetch(`/api/admin/listings/${listingId}/takedown`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reason }),
    });
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10 text-center text-sm text-[#9A9A9A]">
        User not found.
      </div>
    );
  }

  const displayName = profile.displayName ?? profile.name;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 lg:px-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/reports" className="text-[#9A9A9A] hover:text-[#F2F2F2]">
          <ArrowLeftIcon className="size-5" />
        </Link>
        <h1 className="text-xl font-bold text-[#F2F2F2]">User Detail</h1>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-white/10 bg-surface p-5 flex items-start gap-4">
        {profile.image ? (
          <img src={profile.image} alt={displayName} className="size-14 rounded-full object-cover shrink-0" />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-surface2 text-lg font-bold text-[#9A9A9A]">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-[#F2F2F2]">{displayName}</p>
            {profile.isAdmin && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">Admin</span>
            )}
            {profile.isBanned && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">Banned</span>
            )}
            {profile.phoneVerified && (
              <span className="flex items-center gap-0.5 rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <ShieldCheckIcon className="size-3" /> Verified
              </span>
            )}
          </div>
          <p className="text-xs text-[#9A9A9A]">{profile.email}</p>
          <div className="mt-2 flex gap-4 text-xs text-[#9A9A9A]">
            <span className="flex items-center gap-1">
              <StarIcon className="size-3" /> {profile.reputationScore} rep
            </span>
            <span>{profile.noShowCount} no-show{profile.noShowCount !== 1 ? "s" : ""}</span>
            <span>Joined {new Date(profile.createdAt).toLocaleDateString("en-PH")}</span>
          </div>
          {profile.bannedReason && (
            <p className="mt-2 text-xs text-red-400">Ban reason: {profile.bannedReason}</p>
          )}
        </div>
      </div>

      {/* Ban / Unban */}
      <div className="rounded-2xl border border-white/10 bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#F2F2F2]">
          {profile.isBanned ? "Unban User" : "Ban User"}
        </h2>
        {!profile.isBanned && (
          <input
            type="text"
            placeholder="Ban reason (required)"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            className="mb-3 w-full rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-white/20 focus:outline-none"
          />
        )}
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <button
          onClick={toggleBan}
          disabled={working}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
            profile.isBanned
              ? "bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 hover:bg-emerald-600/30"
              : "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
          }`}
        >
          <ShieldExclamationIcon className="size-4" />
          {working ? "Working…" : profile.isBanned ? "Unban User" : "Ban User"}
        </button>
      </div>

      {/* Reports against this user */}
      <div className="rounded-2xl border border-white/10 bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#F2F2F2]">
          Reports Against This User ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="text-xs text-[#9A9A9A]">No reports filed against this user.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((rep) => (
              <div key={rep.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-xs">
                <span className="text-[#F2F2F2]">{rep.reason}</span>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${
                    rep.status === "open"      ? "text-yellow-400" :
                    rep.status === "reviewing" ? "text-blue-400"   :
                    rep.status === "resolved"  ? "text-emerald-400":
                    "text-[#9A9A9A]"
                  }`}>{rep.status}</span>
                  <span className="text-[#9A9A9A]">
                    {new Date(rep.createdAt).toLocaleDateString("en-PH")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl border border-white/10 bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#F2F2F2]">Recent Transactions</h2>
        {txns.length === 0 ? (
          <p className="text-xs text-[#9A9A9A]">No transactions found.</p>
        ) : (
          <div className="space-y-2">
            {txns.map((t) => (
              <Link
                key={t.id}
                href={`/transactions/${t.id}`}
                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-xs hover:border-white/20"
              >
                <span className="font-mono text-accent">{t.id.slice(0, 12)}…</span>
                <span className={`font-medium ${
                  t.status === "completed"  ? "text-emerald-400" :
                  t.status === "no_show"    ? "text-red-400"     :
                  t.status === "cancelled"  ? "text-[#9A9A9A]"   :
                  "text-yellow-400"
                }`}>{t.status}</span>
                <span className="text-[#9A9A9A]">{new Date(t.createdAt).toLocaleDateString("en-PH")}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
