"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import Link from "next/link";
import {
  ShieldCheckIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  BellAlertIcon,
  StarIcon,
  TagIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";

type IconCmp = React.ComponentType<{ className?: string }>;

interface BentoItem {
  id:       string;
  wide?:    true;
  featured?: true;
  icon:     IconCmp;
  title:    string;
  body:     string;
  color:    string;
  border:   string;
  bg:       string;
  iconBg:   string;
  glowVar:  string;
  num:      string;
  href?:    string;
}

const BENTO: BentoItem[] = [
  {
    id: "verified", icon: ShieldCheckIcon, num: "01",
    title: "Verified Sellers",
    body: "Every seller verifies their Philippine mobile number before listing. No anonymous accounts.",
    color: "text-emerald-400", border: "hover:border-emerald-500/25",
    bg: "bg-emerald-500/[0.06]", iconBg: "bg-emerald-500/10",
    glowVar: "rgba(16,185,129,0.12)",
  },
  {
    id: "auctions", wide: true, featured: true, href: "/auction",
    icon: BoltIcon, num: "02",
    title: "Live Auctions",
    body: "Bid in real-time with anti-snipe protection. Auctions auto-extend when bids arrive in the final 30 seconds.",
    color: "text-accent", border: "hover:border-accent/35",
    bg: "bg-accent/[0.07]", iconBg: "bg-accent/10",
    glowVar: "rgba(226,75,74,0.14)",
  },
  {
    id: "offers", icon: TagIcon, num: "03",
    title: "Make Offers",
    body: "Don't like the price? Send a counter-offer. Sellers can accept, decline, or counter back.",
    color: "text-yellow-400", border: "hover:border-yellow-500/25",
    bg: "bg-yellow-500/[0.06]", iconBg: "bg-yellow-500/10",
    glowVar: "rgba(234,179,8,0.12)",
  },
  {
    id: "wishlist", icon: BellAlertIcon, num: "04",
    title: "Wishlist Alerts",
    body: "Add cards to your wishlist and get notified the moment a seller lists one — before anyone else.",
    color: "text-purple-400", border: "hover:border-purple-500/25",
    bg: "bg-purple-500/[0.06]", iconBg: "bg-purple-500/10",
    glowVar: "rgba(168,85,247,0.12)",
  },
  {
    id: "reputation", icon: StarIcon, num: "05",
    title: "Reputation System",
    body: "Buyers and sellers rate each other after every deal. No-shows are tracked and flagged automatically.",
    color: "text-amber-400", border: "hover:border-amber-500/25",
    bg: "bg-amber-500/[0.06]", iconBg: "bg-amber-500/10",
    glowVar: "rgba(245,158,11,0.12)",
  },
  {
    id: "messaging", wide: true,
    icon: ChatBubbleLeftRightIcon, num: "06",
    title: "In-App Messaging",
    body: "Negotiate, confirm meetup details, and coordinate entirely inside the platform — no sharing personal numbers.",
    color: "text-sky-400", border: "hover:border-sky-500/25",
    bg: "bg-sky-500/[0.06]", iconBg: "bg-sky-500/10",
    glowVar: "rgba(14,165,233,0.12)",
  },
  {
    id: "collection", icon: RectangleStackIcon, num: "07",
    title: "Collection Manager",
    body: "Track every card you own, organise by folders, and share your collection publicly with a personal profile URL.",
    color: "text-teal-400", border: "hover:border-teal-500/25",
    bg: "bg-teal-500/[0.06]", iconBg: "bg-teal-500/10",
    glowVar: "rgba(20,184,166,0.12)",
  },
];

const EASE_EXPO = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075, delayChildren: 0.1 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_EXPO },
  },
};

const BID_HISTORY = [
  { label: "₱4,050", active: false, delay: 0.55 },
  { label: "₱4,200", active: false, delay: 0.7  },
  { label: "₱4,500", active: true,  delay: 0.85 },
];

export function FeaturesSection() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-28 lg:px-10">

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-accent/[0.04] blur-[160px]" />
        <div className="absolute right-1/4 bottom-0 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-purple-600/[0.04] blur-[140px]" />
        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Vignette to fade grid at edges */}
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div>

      <div className="mx-auto max-w-screen-xl">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: EASE_EXPO }}
          className="mb-16 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9A9A9A]">
            Everything you need
          </span>

          <h2 className="font-display mt-5 text-4xl font-bold tracking-tight text-[#F2F2F2] lg:text-[2.8rem] lg:leading-tight">
            Built for{" "}
            <span className="bg-gradient-to-r from-[#F2F2F2] via-accent to-purple-400 bg-clip-text text-transparent">
              serious collectors
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#9A9A9A]">
            Every tool you need to buy, sell, and manage your TCG collection — safely.
          </p>
        </motion.div>

        {/* Bento grid — 3 cols on lg, 2 cols on sm, 1 on mobile
            Row 1: [Verified Sellers 1col] [Live Auctions 2col]
            Row 2: [Make Offers 1col] [Wishlist 1col] [Reputation 1col]
            Row 3: [Messaging 2col] [Collection 1col]
        */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {BENTO.map((item) => {
            const Icon = item.icon;
            const wideClass = item.wide ? "sm:col-span-2 lg:col-span-2" : "";

            return (
              <motion.div
                key={item.id}
                variants={cardAnim}
                whileHover={{
                  scale: 1.018,
                  boxShadow: `0 24px 64px -12px ${item.glowVar}, 0 0 0 1px rgba(255,255,255,0.08)`,
                  transition: { type: "spring", stiffness: 320, damping: 22 },
                }}
                className={[
                  "group relative overflow-hidden rounded-2xl border border-white/[0.08]",
                  "bg-surface shadow-xl shadow-black/30 transition-[border-color] duration-300",
                  item.border,
                  wideClass,
                  item.featured ? "p-7" : "p-6",
                ].join(" ")}
              >
                {/* Link overlay for clickable cards */}
                {item.href && (
                  <Link href={item.href} className="absolute inset-0 z-10" aria-label={item.title} />
                )}

                {/* Color wash — reveals on hover */}
                <div
                  className={[
                    "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                    item.bg,
                  ].join(" ")}
                />

                {/* Giant decorative background icon */}
                <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-[0.035] transition-opacity duration-300 group-hover:opacity-[0.065]">
                  <Icon className={item.featured ? "size-56" : "size-44"} />
                </div>

                <div className="relative">

                  {/* Top row: icon chip + item number */}
                  <div className="mb-5 flex items-start justify-between">
                    <div className={[
                      "inline-flex rounded-xl p-2.5 transition-transform duration-200",
                      "group-hover:scale-110 group-hover:rotate-[-3deg]",
                      item.iconBg,
                    ].join(" ")}>
                      <Icon className={`size-5 ${item.color}`} />
                    </div>
                    <span className="select-none font-mono text-[11px] font-bold text-white/[0.07]">
                      {item.num}
                    </span>
                  </div>

                  {/* LIVE badge — featured card only */}
                  {item.featured && (
                    <div className="mb-3.5 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
                        <motion.span
                          animate={{ opacity: [1, 0.15, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="size-1.5 rounded-full bg-red-400"
                        />
                        Live now
                      </span>
                    </div>
                  )}

                  <h3 className={[
                    "font-display font-semibold text-[#F2F2F2]",
                    item.featured ? "text-xl mb-2" : "text-base mb-2",
                  ].join(" ")}>
                    {item.title}
                  </h3>

                  <p className={[
                    "text-sm leading-relaxed text-[#9A9A9A]",
                    item.featured ? "max-w-xs" : "",
                  ].join(" ")}>
                    {item.body}
                  </p>

                  {/* Featured card extras */}
                  {item.featured && (
                    <div className="mt-6 space-y-5">

                      {/* Animated bid activity */}
                      <div className="flex flex-wrap items-center gap-2">
                        {BID_HISTORY.map(({ label, active, delay }) => (
                          <motion.span
                            key={label}
                            initial={{ opacity: 0, scale: 0.7, y: 6 }}
                            animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                            transition={{ delay, duration: 0.45, ease: "backOut" }}
                            className={[
                              "rounded-lg border px-3 py-1.5 text-[12px] font-bold tabular-nums",
                              active
                                ? "border-accent/45 bg-accent/12 text-accent"
                                : "border-white/[0.07] bg-white/[0.03] text-[#9A9A9A] line-through",
                            ].join(" ")}
                          >
                            {label}
                          </motion.span>
                        ))}
                        <span className="text-[10px] text-white/20">recent bids</span>
                      </div>

                      <p className={`relative z-20 text-sm font-semibold ${item.color}`}>
                        Browse live auctions →
                      </p>
                    </div>
                  )}

                  {/* Wide non-featured: subtle CTA line at bottom */}
                  {item.wide && !item.featured && (
                    <p className={`mt-5 text-xs font-semibold ${item.color} opacity-0 transition-opacity duration-200 group-hover:opacity-100`}>
                      Start chatting →
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
