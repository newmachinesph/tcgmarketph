"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  BoltIcon,
  PhotoIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const BENEFITS = [
  { icon: BoltIcon,         label: "Up to 500 active listings",        sub: "Free tier is capped at 10" },
  { icon: PhotoIcon,        label: "10 photos per listing",             sub: "Free tier allows 3" },
  { icon: ShieldCheckIcon,  label: "Power Seller badge on your profile", sub: "Signals trust to buyers" },
  { icon: ChartBarIcon,     label: "Advanced listing analytics",         sub: "Views, conversion rate, time-to-sale" },
  { icon: CheckCircleIcon,  label: "Priority in search results",         sub: "Your listings appear higher" },
];

const FREE_FEATURES = [
  "10 active listings",
  "3 photos per listing",
  "Cash on meetup only",
  "Basic dashboard",
];

const POWER_FEATURES = [
  "500 active listings",
  "10 photos per listing",
  "Power Seller badge",
  "Advanced analytics",
  "Priority in search",
  "All free features",
];

export function UpgradeClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function subscribe() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/billing/subscribe", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      window.location.href = data.checkoutUrl;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start payment");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-16 lg:px-10">

      {/* Header */}
      <div className="text-center mb-14">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent mb-4">
          <BoltIcon className="size-3.5" /> Power Seller
        </span>
        <h1 className="text-4xl font-extrabold text-[#F2F2F2]">Sell more, earn more</h1>
        <p className="mt-3 text-base text-[#9A9A9A] max-w-lg mx-auto">
          Unlock higher listing limits, more photos, and analytics that show you exactly what's working.
        </p>
      </div>

      {/* Comparison cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-14">

        {/* Free */}
        <div className="rounded-2xl border border-white/10 bg-surface p-6 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">Free</p>
            <p className="mt-1 text-3xl font-bold text-[#F2F2F2]">₱0 <span className="text-sm font-normal text-[#9A9A9A]">/mo</span></p>
          </div>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#9A9A9A]">
                <CheckCircleIcon className="size-4 shrink-0 text-white/20" /> {f}
              </li>
            ))}
          </ul>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="block w-full rounded-xl border border-white/10 py-2.5 text-center text-sm font-medium text-[#9A9A9A] transition hover:border-white/20"
            >
              Current plan
            </Link>
          </div>
        </div>

        {/* Power Seller */}
        <div className="relative rounded-2xl border-2 border-accent/40 bg-surface p-6 space-y-4">
          <div className="absolute -top-3 left-6">
            <span className="rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              Recommended
            </span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Power Seller</p>
            <p className="mt-1 text-3xl font-bold text-[#F2F2F2]">₱299 <span className="text-sm font-normal text-[#9A9A9A]">/30 days</span></p>
          </div>
          <ul className="space-y-2">
            {POWER_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#F2F2F2]">
                <CheckCircleIcon className="size-4 shrink-0 text-accent" /> {f}
              </li>
            ))}
          </ul>
          <div className="pt-2 space-y-2">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={subscribe}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-60"
            >
              {loading ? "Opening payment…" : "Upgrade — ₱299"}
              {!loading && <ArrowRightIcon className="size-4" />}
            </button>
            <p className="text-center text-[10px] text-[#9A9A9A]">
              Pay via QR Ph · No auto-renewal · Active for 30 days from payment date
            </p>
          </div>
        </div>
      </div>

      {/* Benefits detail */}
      <div className="rounded-2xl border border-white/10 bg-surface p-6">
        <h2 className="text-sm font-semibold text-[#F2F2F2] mb-4">What you get</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Icon className="size-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F2F2F2]">{label}</p>
                <p className="text-xs text-[#9A9A9A]">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-10 space-y-4 text-sm">
        <h2 className="font-semibold text-[#F2F2F2]">FAQ</h2>
        {[
          ["How long is the subscription?", "30 days from the date your payment is confirmed. No automatic renewals."],
          ["How do I pay?", "Via QR Ph — scan the QR code from any Philippine bank or e-wallet (GCash, Maya, etc.)."],
          ["What happens when it expires?", "Your account reverts to the Free tier. Active listings beyond the 10-listing limit are paused until you renew."],
          ["Can I cancel early?", "There are no refunds once payment is confirmed, but the subscription doesn't auto-renew so you simply don't renew next month."],
        ].map(([q, a]) => (
          <div key={q} className="rounded-xl border border-white/10 bg-surface p-4">
            <p className="font-medium text-[#F2F2F2]">{q}</p>
            <p className="mt-1 text-[#9A9A9A]">{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
