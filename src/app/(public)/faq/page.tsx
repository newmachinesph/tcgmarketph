"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const EASE_EXPO = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.55, ease: EASE_EXPO } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const FAQS: { q: string; a: string; section: string }[] = [
  { section: "Getting started", q: "Is it free to create an account?",
    a: "Yes, completely free. No credit card required, no subscription, no hidden fees." },
  { section: "Getting started", q: "Do I need to verify my account to buy?",
    a: "You can browse and make offers as a basic account. To purchase and complete transactions you need a verified phone number. Phone verification is free and takes about 2 minutes via OTP." },
  { section: "Getting started", q: "What games are supported?",
    a: "Currently Pokémon TCG and One Piece TCG (all sets, English and Japanese). We're adding more games — Yu-Gi-Oh!, Magic: The Gathering, and Lorcana are on the roadmap." },
  { section: "Getting started", q: "Is TCGMarket PH only for Metro Manila?",
    a: "No! We have sellers and buyers across the Philippines — Cebu, Davao, Iloilo, and more. The meetup system works anywhere in the country. Just make sure to agree on a convenient spot." },

  { section: "Buying", q: "How does buying a card work?",
    a: "Find a listing you want, click 'Buy Now' to commit to the price, or 'Make Offer' to negotiate. The seller confirms, you coordinate a meetup via in-app messaging, then exchange card for cash face-to-face. After the deal, you both rate each other." },
  { section: "Buying", q: "Can I make a counter-offer?",
    a: "Yes. Use 'Make Offer' to send your price. The seller can accept, decline, or counter back with a different price. You can then accept or decline the counter. This negotiation happens entirely inside the app." },
  { section: "Buying", q: "What if the card looks different from the photos?",
    a: "Don't pay. Inspect the card carefully before handing over cash. If the card doesn't match the listing, decline the deal and report the listing through the app. The seller risks having their account suspended." },
  { section: "Buying", q: "Is there buyer protection?",
    a: "The cash-on-meetup model is inherently protective — you see and inspect the card before you pay. Additionally, our dispute system lets you file a complaint if a seller no-shows or misrepresents a card. Admin reviews every dispute." },

  { section: "Selling", q: "How do I start selling?",
    a: "Verify your phone number in your profile, then go to My Listings → New Listing. You'll select the card from our catalog, upload photos of your actual card, set a price and condition, and publish." },
  { section: "Selling", q: "Are there listing fees or commissions?",
    a: "Zero. No listing fee, no commission on sales, no subscription required. We're building a community platform, not a transaction-fee business." },
  { section: "Selling", q: "How many listings can I have?",
    a: "Free accounts can have up to 20 active listings. Power Seller accounts remove this limit and get featured placement." },
  { section: "Selling", q: "What is KYC verification and do I need it?",
    a: "KYC (Know Your Customer) is government ID verification through our partner Didit. It's optional but adds a verified badge to your profile, which significantly increases buyer trust. Sellers with KYC see more offers and faster conversions." },

  { section: "Listings & pricing", q: "How should I price my cards?",
    a: "Each listing shows a market reference price (from international TCG price APIs) in your preferred currency. Filipino collectors typically price slightly below international rates since there's no shipping. Near Mint cards command near-market prices; played copies are discounted accordingly." },
  { section: "Listings & pricing", q: "How long does a listing stay active?",
    a: "30 days by default. You'll get a notification before expiry so you can relist. You can also pause or cancel a listing at any time from My Listings." },
  { section: "Listings & pricing", q: "Can I do auctions?",
    a: "Yes! When creating a listing, choose 'Auction' type. Set a starting price, bid increment, reserve price (optional), and auction end time. Auctions auto-extend by 30 seconds when a bid arrives in the final 30 seconds to prevent sniping." },

  { section: "Safety & trust", q: "What if someone doesn't show up to the meetup?",
    a: "Mark the transaction as 'No-show' in the app. The absent party gets a no-show mark on their public profile. Three no-shows trigger an automatic flag for admin review. Repeated no-shows result in account suspension." },
  { section: "Safety & trust", q: "How do I report a scam or suspicious user?",
    a: "Use the report button on any listing, seller profile, or message. Admin reviews all reports within 24 hours. For urgent situations or confirmed fraud, contact us directly at support@tcgmarket.ph." },
  { section: "Safety & trust", q: "How is the reputation score calculated?",
    a: "Every completed deal adds +1 to both buyer's and seller's reputation score. Ratings (1–5 stars) from both sides are also displayed publicly. The score cannot be bought, boosted artificially, or deleted — it's built entirely from real transactions." },

  { section: "Technical", q: "Can I use TCGMarket PH on mobile?",
    a: "Yes, the platform is fully responsive and works on all modern mobile browsers. A dedicated iOS/Android app is on our roadmap." },
  { section: "Technical", q: "How do notifications work?",
    a: "You'll receive in-app notifications for new offers, transaction updates, wishlist matches, and messages. Email notifications for key events (deal confirmed, deal completed) can be managed in your Settings → Email preferences." },
];

const SECTIONS = [...new Set(FAQS.map((f) => f.section))];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={[
        "cursor-pointer rounded-2xl border bg-surface transition-[border-color] duration-200",
        open ? "border-white/15" : "border-white/[0.08] hover:border-white/12",
      ].join(" ")}
      onClick={() => setOpen((v) => !v)}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); } }}
    >
      <div className="flex items-start justify-between gap-4 p-5">
        <p className="text-sm font-semibold text-[#F2F2F2]">{q}</p>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: EASE_EXPO }}
          className="mt-0.5 shrink-0"
        >
          <ChevronDownIcon className="size-4 text-[#9A9A9A]" />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_EXPO }}
            style={{ overflow: "hidden" }}
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-[#9A9A9A]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQPage() {
  const heroRef    = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true });
  const listRef    = useRef<HTMLDivElement>(null);
  const listInView = useInView(listRef, { once: true, margin: "-60px" });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const filtered = activeSection ? FAQS.filter((f) => f.section === activeSection) : FAQS;

  return (
    <div className="relative mx-auto w-full max-w-3xl px-6 py-16 lg:px-10 space-y-12 overflow-hidden">

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-accent/[0.04] blur-[140px]" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Hero */}
      <div ref={heroRef} className="text-center space-y-4">
        <motion.span
          initial={{ opacity: 0, scale: 0.85 }}
          animate={heroInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, ease: EASE_EXPO }}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#9A9A9A]"
        >
          FAQ
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE_EXPO }}
          className="font-display text-4xl font-bold tracking-tight text-[#F2F2F2] lg:text-5xl"
        >
          Frequently asked{" "}
          <span className="bg-gradient-to-r from-[#F2F2F2] via-accent to-purple-400 bg-clip-text text-transparent">
            questions
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE_EXPO }}
          className="text-[15px] leading-relaxed text-[#9A9A9A]"
        >
          Everything you need to know about buying and selling on TCGMarket PH.
        </motion.p>
      </div>

      {/* Section filter pills */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={heroInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, delay: 0.3, ease: EASE_EXPO }}
        className="flex flex-wrap gap-2"
      >
        {[null, ...SECTIONS].map((s) => {
          const active = s === activeSection;
          return (
            <motion.button
              key={s ?? "all"}
              onClick={() => setActiveSection(s)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={[
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-200",
                active
                  ? "bg-accent text-white shadow-lg shadow-accent/20"
                  : "border border-white/[0.08] text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]",
              ].join(" ")}
            >
              {s ?? "All"}
            </motion.button>
          );
        })}
      </motion.div>

      {/* FAQ list */}
      <motion.div
        ref={listRef}
        variants={stagger}
        initial="hidden"
        animate={listInView ? "show" : "hidden"}
        className="space-y-2.5"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection ?? "all"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-2.5"
          >
            {filtered.map((f, i) => (
              <FAQItem key={f.q} q={f.q} a={f.a} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Still have questions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: EASE_EXPO }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface p-7 text-center"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.03] to-purple-600/[0.02]" />
        <div className="relative">
          <p className="font-semibold text-[#F2F2F2]">Still have questions?</p>
          <p className="mt-2 text-sm text-[#9A9A9A]">
            Reach us at{" "}
            <a href="mailto:support@tcgmarket.ph" className="text-accent hover:underline">support@tcgmarket.ph</a>
            {" "}or check our{" "}
            <Link href="/safety" className="text-accent hover:underline">safety guide</Link>.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/marketplace" className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 active:scale-95">
              Browse marketplace
            </Link>
            <Link href="/signup" className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-semibold text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
              Create free account
            </Link>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
