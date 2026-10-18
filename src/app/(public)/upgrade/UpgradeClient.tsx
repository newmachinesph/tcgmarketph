"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import {
  CheckCircleIcon, BoltIcon, PhotoIcon, ShieldCheckIcon,
  ChartBarIcon, ArrowRightIcon,
} from "@heroicons/react/24/outline";

const EASE_EXPO = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.6, ease: EASE_EXPO } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const FREE_FEATURES  = ["10 active listings", "1 photo per listing", "Cash on meetup only", "Basic dashboard"];
const POWER_FEATURES = ["50 active listings", "3 photos per listing", "Live auctions", "Power Seller badge", "Advanced analytics", "Priority in search", "All free features"];

const BENEFITS = [
  { icon: BoltIcon,         label: "Up to 50 active listings",          sub: "Free tier is capped at 10",           color: "text-accent",     bg: "bg-accent/10" },
  { icon: PhotoIcon,        label: "3 photos per listing",               sub: "Free tier allows 1",                  color: "text-sky-400",    bg: "bg-sky-400/10" },
  { icon: ShieldCheckIcon,  label: "Power Seller badge",                 sub: "Signals trust to buyers",             color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { icon: BoltIcon,         label: "Live auctions",                      sub: "Create auction listings (Pro only)",  color: "text-accent",     bg: "bg-accent/10" },
  { icon: ChartBarIcon,     label: "Advanced listing analytics",         sub: "Views, conversion rate, time-to-sale", color: "text-purple-400", bg: "bg-purple-400/10" },
  { icon: CheckCircleIcon,  label: "Priority in search results",         sub: "Your listings appear higher",         color: "text-yellow-400", bg: "bg-yellow-400/10" },
];

const FAQS = [
  { q: "How long is the subscription?", a: "30 days from the date your payment is confirmed. No automatic renewals." },
  { q: "How do I pay?", a: "Via QR Ph — scan the QR code from any Philippine bank or e-wallet (GCash, Maya, etc.)." },
  { q: "What happens when it expires?", a: "Your account reverts to the Free tier. Active listings beyond 10 are paused and auctions are disabled until you renew." },
  { q: "Can I cancel early?", a: "There are no refunds once payment is confirmed, but the subscription doesn't auto-renew so you simply don't renew next month." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      className={`cursor-pointer rounded-xl border bg-surface transition-[border-color] duration-200 ${open ? "border-white/15" : "border-white/[0.08] hover:border-white/12"}`}
      onClick={() => setOpen((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); } }}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <p className="text-sm font-medium text-[#F2F2F2]">{q}</p>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: EASE_EXPO }}
          className="mt-0.5 shrink-0 text-[#9A9A9A]"
        >
          ↓
        </motion.span>
      </div>
      {open && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="px-5 pb-5 text-sm leading-relaxed text-[#9A9A9A]"
        >
          {a}
        </motion.p>
      )}
    </motion.div>
  );
}

export function UpgradeClient() {
  const heroRef    = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });
  const bodyRef    = useRef<HTMLDivElement>(null);
  const bodyInView = useInView(bodyRef, { once: true, margin: "-60px" });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

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
    <div className="relative mx-auto w-full max-w-5xl px-6 py-16 lg:px-10 overflow-hidden">

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-accent/[0.05] blur-[150px]" />
        <div className="absolute right-0 bottom-1/3 h-[350px] w-[350px] rounded-full bg-purple-600/[0.04] blur-[120px]" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Hero */}
      <div ref={heroRef} className="text-center mb-16 space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={heroInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: EASE_EXPO }}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-accent"
        >
          <BoltIcon className="size-3.5" /> Power Seller
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE_EXPO }}
          className="font-display text-4xl font-extrabold tracking-tight text-[#F2F2F2] lg:text-5xl"
        >
          Sell more,{" "}
          <span className="bg-gradient-to-r from-accent via-orange-400 to-yellow-400 bg-clip-text text-transparent">
            earn more
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE_EXPO }}
          className="mx-auto max-w-lg text-[15px] text-[#9A9A9A]"
        >
          Unlock higher listing limits, more photos, and analytics that show you exactly what&apos;s working.
        </motion.p>
      </div>

      {/* Pricing cards */}
      <motion.div
        ref={bodyRef}
        variants={stagger}
        initial="hidden"
        animate={bodyInView ? "show" : "hidden"}
        className="grid gap-4 md:grid-cols-2 mb-14"
      >
        {/* Free */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-white/[0.08] bg-surface p-6 space-y-5"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#9A9A9A]">Free</p>
            <p className="mt-1.5 font-display text-4xl font-bold text-[#F2F2F2]">
              ₱0 <span className="text-sm font-normal text-[#9A9A9A]">/mo</span>
            </p>
          </div>
          <ul className="space-y-2.5">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#9A9A9A]">
                <CheckCircleIcon className="size-4 shrink-0 text-white/20" /> {f}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="block w-full rounded-xl border border-white/10 py-2.5 text-center text-sm font-medium text-[#9A9A9A] transition hover:border-white/20"
          >
            Current plan
          </Link>
        </motion.div>

        {/* Power Seller */}
        <motion.div
          variants={fadeUp}
          whileHover={{ boxShadow: "0 32px 80px -16px rgba(226,75,74,0.2)", transition: { type: "spring", stiffness: 200, damping: 20 } }}
          className="relative overflow-hidden rounded-2xl border-2 border-accent/40 bg-surface p-6 space-y-5"
        >
          {/* Gradient shimmer at top */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_top_center,rgba(226,75,74,0.06),transparent_60%)]" />

          <div className="absolute -top-3.5 left-6">
            <span className="rounded-full bg-accent px-3.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-accent/30">
              Recommended
            </span>
          </div>

          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent">Power Seller</p>
            <p className="mt-1.5 font-display text-4xl font-bold text-[#F2F2F2]">
              ₱199 <span className="text-sm font-normal text-[#9A9A9A]">/30 days</span>
            </p>
          </div>

          <ul className="relative space-y-2.5">
            {POWER_FEATURES.map((f, i) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: -10 }}
                animate={bodyInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease: EASE_EXPO }}
                className="flex items-center gap-2 text-sm text-[#F2F2F2]"
              >
                <CheckCircleIcon className="size-4 shrink-0 text-accent" /> {f}
              </motion.li>
            ))}
          </ul>

          <div className="relative space-y-2.5">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={subscribe}
              disabled={loading}
              className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-accent py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Opening payment…" : "Upgrade — ₱199"}
              {!loading && <ArrowRightIcon className="size-4" />}
            </button>
            <p className="text-center text-[10px] text-[#9A9A9A]">
              Pay via QR Ph · No auto-renewal · Active for 30 days from payment date
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Benefits */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="rounded-2xl border border-white/[0.08] bg-surface p-7 mb-10"
      >
        <motion.h2 variants={fadeUp} className="font-display text-sm font-semibold text-[#F2F2F2] mb-6">What you get</motion.h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, label, sub, color, bg }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              whileHover={{ scale: 1.02, transition: { type: "spring", stiffness: 300 } }}
              className="flex items-start gap-3"
            >
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`size-4 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#F2F2F2]">{label}</p>
                <p className="text-xs text-[#9A9A9A]">{sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="space-y-3"
      >
        <motion.h2 variants={fadeUp} className="font-display font-semibold text-[#F2F2F2]">FAQ</motion.h2>
        {FAQS.map(({ q, a }) => (
          <FAQItem key={q} q={q} a={a} />
        ))}
      </motion.div>
    </div>
  );
}
