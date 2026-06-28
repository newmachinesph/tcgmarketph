"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import {
  ShieldCheckIcon, UserGroupIcon, HeartIcon, SparklesIcon,
  ArrowRightIcon, RectangleStackIcon, LinkIcon, LockOpenIcon,
} from "@heroicons/react/24/outline";

const EASE_EXPO = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.6, ease: EASE_EXPO } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

const VALUES = [
  { icon: ShieldCheckIcon, title: "Safety first",
    body: "Every transaction is cash-on-meetup in a public place. No shipping means no package scams, no chargebacks, no lost parcels.",
    color: "text-bid", iconBg: "bg-bid/10", hover: "hover:border-bid/25", glow: "rgba(93,202,165,0.12)" },
  { icon: UserGroupIcon, title: "Community-built",
    body: "TCGMarket PH was built by collectors, for collectors. We understand the hobby because we live it.",
    color: "text-purple-400", iconBg: "bg-purple-400/10", hover: "hover:border-purple-500/25", glow: "rgba(168,85,247,0.12)" },
  { icon: HeartIcon, title: "Zero fees",
    body: "Listing is free. Selling is free. We make money when the platform grows, not when you trade.",
    color: "text-accent", iconBg: "bg-accent/10", hover: "hover:border-accent/25", glow: "rgba(226,75,74,0.12)" },
  { icon: SparklesIcon, title: "Transparent reputation",
    body: "Every buyer and seller has a public reputation score built from real completed deals. No fake reviews.",
    color: "text-yellow-400", iconBg: "bg-yellow-400/10", hover: "hover:border-yellow-500/25", glow: "rgba(234,179,8,0.12)" },
];

const TIMELINE = [
  { year: "Jun 2026", event: "TCGMarket PH launched — built by Filipino collectors tired of Facebook group scams. First 100 verified sellers joined in week one.", future: false },
  { year: "Jul 2026", event: "One Piece TCG catalog added. Live auction system launched with anti-snipe bid extension.", future: false },
  { year: "Aug 2026", event: "KYC verification through Didit and real-time messaging deployed. Reputation scores go live.", future: false },
  { year: "Coming soon", event: "iOS & Android app, Yu-Gi-Oh!, Magic: The Gathering, Lorcana support on the roadmap.", future: true },
];

const SOLUTION_ITEMS = [
  "Phone + KYC verification before a seller can list",
  "Public reputation scores built from real completed deals",
  "In-app messaging — no need to share personal numbers",
  "Cash-on-meetup model: card and cash exchange simultaneously",
  "Admin moderation and no-show tracking",
];

const COLLECTION_FEATURES = [
  { icon: RectangleStackIcon, text: "Log every card with condition, grade, and quantity" },
  { icon: SparklesIcon,       text: "Organise into custom folders — by set, game, or anything" },
  { icon: LinkIcon,           text: "Shareable public profile URL — /sellers/your-username" },
  { icon: LockOpenIcon,       text: "Public or private — you control who sees your collection" },
];

export function AboutContent() {
  const heroRef    = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="relative mx-auto w-full max-w-screen-lg px-6 py-16 lg:px-10 space-y-24 overflow-hidden">

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/[0.04] blur-[140px]" />
        <div className="absolute right-0 bottom-1/3 h-[400px] w-[400px] rounded-full bg-purple-600/[0.04] blur-[120px]" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Hero */}
      <div ref={heroRef} className="text-center space-y-5">
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={heroInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: EASE_EXPO }}
          className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent"
        >
          🇵🇭 Made in the Philippines
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE_EXPO }}
          className="font-display text-5xl font-bold tracking-tight text-[#F2F2F2] lg:text-6xl"
        >
          Built for Filipino<br />
          <span className="bg-gradient-to-r from-[#F2F2F2] via-accent to-purple-400 bg-clip-text text-transparent">
            card collectors
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.2, ease: EASE_EXPO }}
          className="mx-auto max-w-2xl text-lg leading-relaxed text-[#9A9A9A]"
        >
          TCGMarket PH started with a simple idea: Filipino collectors deserve a safe,
          scam-free place to buy and sell trading cards — without shipping risks, hidden
          fees, or fake accounts.
        </motion.p>
      </div>

      {/* Mission */}
      <Reveal>
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface p-10 lg:p-14 text-center"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.04] to-purple-600/[0.03]" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
          <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A9A9A]">Our mission</p>
          <p className="relative mt-6 text-2xl font-semibold leading-relaxed text-[#F2F2F2] lg:text-[1.75rem]">
            &ldquo;Make every card trade in the Philippines{" "}
            <span className="text-accent">safe, fair, and free</span> — so the hobby can grow.&rdquo;
          </p>
        </motion.div>
      </Reveal>

      {/* Problem / Solution */}
      <Reveal className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#9A9A9A]">The problem</p>
          <h2 className="font-display mt-3 text-3xl font-bold text-[#F2F2F2]">Filipino TCG trading was broken</h2>
          <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-[#9A9A9A]">
            <p>Facebook groups are full of scammers. Buy-and-block, fake photos, ghost sellers after payment — it&apos;s rampant.</p>
            <p>International platforms don&apos;t understand Philippine meetup culture. They&apos;re built around shipping, which doesn&apos;t fit how most Filipino collectors trade.</p>
            <p>There was no platform with identity verification, reputation tracking, and in-app messaging — designed specifically for cash meetups.</p>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl border border-accent/20 bg-accent/[0.05] p-7"
        >
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_top_right,rgba(226,75,74,0.08),transparent_60%)]" />
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-accent">Our solution</p>
          <div className="space-y-3">
            {SOLUTION_ITEMS.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: EASE_EXPO }}
                className="flex items-start gap-2.5 text-[14px] text-[#F2F2F2]"
              >
                <span className="mt-px shrink-0 font-bold text-bid">✓</span>
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Reveal>

      {/* Values */}
      <div>
        <Reveal className="mb-10 text-center">
          <motion.p variants={fadeUp} className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A9A9A]">What we stand for</motion.p>
          <motion.h2 variants={fadeUp} className="font-display mt-3 text-3xl font-bold text-[#F2F2F2]">Our values</motion.h2>
        </Reveal>

        <Reveal className="grid gap-3 sm:grid-cols-2">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                variants={fadeUp}
                whileHover={{ scale: 1.015, boxShadow: `0 20px 60px -12px ${v.glow}`, transition: { type: "spring", stiffness: 300, damping: 22 } }}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface p-6 transition-[border-color] duration-300 ${v.hover}`}
              >
                <div className={`pointer-events-none absolute inset-0 ${v.iconBg} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <div className={`mb-4 inline-flex rounded-xl p-2.5 ${v.iconBg} transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-3deg]`}>
                    <Icon className={`size-5 ${v.color}`} />
                  </div>
                  <h3 className="font-semibold text-[#F2F2F2]">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">{v.body}</p>
                </div>
              </motion.div>
            );
          })}
        </Reveal>
      </div>

      {/* Timeline */}
      <div>
        <Reveal className="mb-10 text-center">
          <motion.p variants={fadeUp} className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A9A9A]">Our story</motion.p>
          <motion.h2 variants={fadeUp} className="font-display mt-3 text-3xl font-bold text-[#F2F2F2]">How we got here</motion.h2>
        </Reveal>

        <div className="relative pl-8 sm:pl-16">
          <div className="absolute left-3 sm:left-7 top-2 bottom-2 w-px bg-gradient-to-b from-accent/50 via-white/10 to-transparent" />
          <div className="space-y-4">
            {TIMELINE.map(({ year, event, future }, i) => (
              <motion.div
                key={year}
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.55, ease: EASE_EXPO }}
                className="relative"
              >
                <div className={`absolute -left-8 sm:-left-[3.3rem] top-5 size-2.5 rounded-full border-2 ${future ? "border-white/20 bg-primary" : "border-accent bg-accent shadow-[0_0_8px_rgba(226,75,74,0.5)]"}`} />
                <div className={`rounded-2xl border p-5 ${future ? "border-white/[0.05] bg-surface/40 opacity-55" : "border-white/[0.08] bg-surface"}`}>
                  <p className={`mb-1.5 text-[11px] font-bold uppercase tracking-wider ${future ? "text-[#9A9A9A]" : "text-accent"}`}>{year}</p>
                  <p className="text-sm leading-relaxed text-[#9A9A9A]">{event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Collection Manager */}
      <Reveal className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <motion.div variants={fadeUp}>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#9A9A9A]">For collectors</p>
          <h2 className="font-display mt-3 text-3xl font-bold text-[#F2F2F2]">Your collection, always organised</h2>
          <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-[#9A9A9A]">
            <p>TCGMarket PH is more than a marketplace — it&apos;s a home for your entire collection. Log every card you own, track graded slabs alongside raw copies, and organise everything into custom folders.</p>
            <p>When you&apos;re ready to sell, listing a card from your collection pre-fills all the details automatically.</p>
            <p>Turn on a public collection URL and share your inventory with other collectors in one link. No screenshots, no spreadsheets.</p>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] p-7"
        >
          <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_top_right,rgba(20,184,166,0.08),transparent_60%)]" />
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400">Collection features</p>
          <div className="space-y-3.5">
            {COLLECTION_FEATURES.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -14 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45, ease: EASE_EXPO }}
                className="flex items-start gap-3 text-[14px] text-[#F2F2F2]"
              >
                <Icon className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Reveal>

      {/* Games */}
      <Reveal>
        <motion.div variants={fadeUp} className="overflow-hidden rounded-3xl border border-white/[0.08] bg-surface p-8 text-center">
          <h2 className="font-display text-xl font-bold text-[#F2F2F2]">Games we support</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {[
              { emoji: "⚡", name: "Pokémon TCG",  desc: "Base Set to Scarlet & Violet", dim: false },
              { emoji: "⚓", name: "One Piece TCG", desc: "All OP sets, EN & JP",         dim: false },
              { emoji: "🎴", name: "More coming",   desc: "Yu-Gi-Oh!, MTG, Lorcana…",     dim: true  },
            ].map((g, i) => (
              <motion.div
                key={g.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: EASE_EXPO }}
                whileHover={!g.dim ? { scale: 1.04, transition: { type: "spring", stiffness: 300 } } : {}}
                className={`flex items-center gap-3 rounded-2xl border border-white/10 px-6 py-4 ${g.dim ? "opacity-40" : "cursor-pointer hover:border-white/20"}`}
              >
                <span className="text-3xl">{g.emoji}</span>
                <div className="text-left">
                  <p className="font-semibold text-[#F2F2F2]">{g.name}</p>
                  <p className="text-xs text-[#9A9A9A]">{g.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Reveal>

      {/* CTA */}
      <Reveal className="text-center">
        <motion.h2 variants={fadeUp} className="font-display text-3xl font-bold text-[#F2F2F2]">Join the community</motion.h2>
        <motion.p variants={fadeUp} className="mt-3 text-[#9A9A9A]">Free accounts. No fees. Just a better way to trade cards.</motion.p>
        <motion.div variants={fadeUp} className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 active:scale-95">
            Create free account <ArrowRightIcon className="size-4" />
          </Link>
          <Link href="/marketplace" className="rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
            Browse marketplace
          </Link>
        </motion.div>
      </Reveal>

    </div>
  );
}
