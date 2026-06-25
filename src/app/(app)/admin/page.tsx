"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UsersIcon,
  TagIcon,
  FlagIcon,
  ArrowPathIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface Stats {
  totalUsers:     number;
  activeListings: number;
  openReports:    number;
  txnsThisWeek:   number;
  bannedUsers:    number;
}

const STAT_CARDS = (s: Stats) => [
  { label: "Total Users",      value: s.totalUsers.toLocaleString(),     icon: UsersIcon,      color: "text-sky-400",    bg: "bg-sky-400/10",    href: "/admin/users"   },
  { label: "Active Listings",  value: s.activeListings.toLocaleString(), icon: TagIcon,        color: "text-bid",        bg: "bg-bid/10",        href: "/listings"      },
  { label: "Open Reports",     value: s.openReports.toLocaleString(),    icon: FlagIcon,       color: "text-accent",     bg: "bg-accent/10",     href: "/admin/reports" },
  { label: "Txns This Week",   value: s.txnsThisWeek.toLocaleString(),   icon: ArrowPathIcon,  color: "text-purple-400", bg: "bg-purple-400/10", href: "/transactions"  },
  { label: "Banned Users",     value: s.bannedUsers.toLocaleString(),    icon: NoSymbolIcon,   color: "text-red-400",    bg: "bg-red-400/10",    href: "/admin/users?banned=true" },
];

const QUICK_LINKS = [
  { label: "Open reports queue", href: "/admin/reports",           badge: null },
  { label: "User search",        href: "/admin/users",             badge: null },
  { label: "Banned users",       href: "/admin/users?banned=true", badge: null },
];

export default function AdminDashboardPage() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#F2F2F2]">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-[#9A9A9A]">Platform overview at a glance.</p>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {STAT_CARDS(stats).map(({ label, value, icon: Icon, color, bg, href }) => (
            <Link key={label} href={href}
              className="group rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-white/20">
              <div className={`mb-3 inline-flex rounded-xl p-2 ${bg}`}>
                <Icon className={`size-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-[#F2F2F2]">{value}</p>
              <p className="mt-0.5 text-xs text-[#9A9A9A]">{label}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#9A9A9A]">Failed to load stats.</p>
      )}

      {/* Quick links */}
      <div className="rounded-2xl border border-white/10 bg-surface overflow-hidden">
        <div className="border-b border-white/10 px-5 py-3">
          <p className="text-sm font-semibold text-[#F2F2F2]">Quick Actions</p>
        </div>
        <div className="divide-y divide-white/5">
          {QUICK_LINKS.map(({ label, href }) => (
            <Link key={href} href={href}
              className="flex items-center justify-between px-5 py-3.5 text-sm text-[#9A9A9A] transition hover:bg-surface2 hover:text-[#F2F2F2]">
              {label}
              <ChevronRightIcon className="size-4 shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
