"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const FAQS: { q: string; a: string; section: string }[] = [
  // Getting started
  { section: "Getting started",
    q: "Is it free to create an account?",
    a: "Yes, completely free. No credit card required, no subscription, no hidden fees." },
  { section: "Getting started",
    q: "Do I need to verify my account to buy?",
    a: "You can browse and make offers as a basic account. To purchase and complete transactions you need a verified phone number. Phone verification is free and takes about 2 minutes via OTP." },
  { section: "Getting started",
    q: "What games are supported?",
    a: "Currently Pokémon TCG and One Piece TCG (all sets, English and Japanese). We're adding more games — Yu-Gi-Oh!, Magic: The Gathering, and Lorcana are on the roadmap." },
  { section: "Getting started",
    q: "Is TCGMarket PH only for Metro Manila?",
    a: "No! We have sellers and buyers across the Philippines — Cebu, Davao, Iloilo, and more. The meetup system works anywhere in the country. Just make sure to agree on a convenient spot." },

  // Buying
  { section: "Buying",
    q: "How does buying a card work?",
    a: "Find a listing you want, click 'Buy Now' to commit to the price, or 'Make Offer' to negotiate. The seller confirms, you coordinate a meetup via in-app messaging, then exchange card for cash face-to-face. After the deal, you both rate each other." },
  { section: "Buying",
    q: "Can I make a counter-offer?",
    a: "Yes. Use 'Make Offer' to send your price. The seller can accept, decline, or counter back with a different price. You can then accept or decline the counter. This negotiation happens entirely inside the app." },
  { section: "Buying",
    q: "What if the card looks different from the photos?",
    a: "Don't pay. Inspect the card carefully before handing over cash. If the card doesn't match the listing, decline the deal and report the listing through the app. The seller risks having their account suspended." },
  { section: "Buying",
    q: "Is there buyer protection?",
    a: "The cash-on-meetup model is inherently protective — you see and inspect the card before you pay. Additionally, our dispute system lets you file a complaint if a seller no-shows or misrepresents a card. Admin reviews every dispute." },

  // Selling
  { section: "Selling",
    q: "How do I start selling?",
    a: "Verify your phone number in your profile, then go to My Listings → New Listing. You'll select the card from our catalog, upload photos of your actual card, set a price and condition, and publish." },
  { section: "Selling",
    q: "Are there listing fees or commissions?",
    a: "Zero. No listing fee, no commission on sales, no subscription required. We're building a community platform, not a transaction-fee business." },
  { section: "Selling",
    q: "How many listings can I have?",
    a: "Free accounts can have up to 20 active listings. Power Seller accounts (coming soon) remove this limit and get featured placement." },
  { section: "Selling",
    q: "What is KYC verification and do I need it?",
    a: "KYC (Know Your Customer) is government ID verification through our partner Didit. It's optional but adds a verified badge to your profile, which significantly increases buyer trust. Sellers with KYC see more offers and faster conversions." },

  // Listings & Pricing
  { section: "Listings & pricing",
    q: "How should I price my cards?",
    a: "Each listing shows a market reference price (from international TCG price APIs) in your preferred currency. Filipino collectors typically price slightly below international rates since there's no shipping. Near Mint cards command near-market prices; played copies are discounted accordingly." },
  { section: "Listings & pricing",
    q: "How long does a listing stay active?",
    a: "30 days by default. You'll get a notification before expiry so you can relist. You can also pause or cancel a listing at any time from My Listings." },
  { section: "Listings & pricing",
    q: "Can I do auctions?",
    a: "Yes! When creating a listing, choose 'Auction' type. Set a starting price, bid increment, reserve price (optional), and auction end time. Auctions auto-extend by 30 seconds when a bid arrives in the final 30 seconds to prevent sniping." },

  // Safety & Trust
  { section: "Safety & trust",
    q: "What if someone doesn't show up to the meetup?",
    a: "Mark the transaction as 'No-show' in the app. The absent party gets a no-show mark on their public profile. Three no-shows trigger an automatic flag for admin review. Repeated no-shows result in account suspension." },
  { section: "Safety & trust",
    q: "How do I report a scam or suspicious user?",
    a: "Use the report button on any listing, seller profile, or message. Admin reviews all reports within 24 hours. For urgent situations or confirmed fraud, contact us directly at support@tcgmarket.ph." },
  { section: "Safety & trust",
    q: "How is the reputation score calculated?",
    a: "Every completed deal adds +1 to both buyer's and seller's reputation score. Ratings (1–5 stars) from both sides are also displayed publicly. The score cannot be bought, boosted artificially, or deleted — it's built entirely from real transactions." },

  // Technical
  { section: "Technical",
    q: "Can I use TCGMarket PH on mobile?",
    a: "Yes, the platform is fully responsive and works on all modern mobile browsers. A dedicated iOS/Android app is on our roadmap." },
  { section: "Technical",
    q: "How do notifications work?",
    a: "You'll receive in-app notifications for new offers, transaction updates, wishlist matches, and messages. Email notifications for key events (deal confirmed, deal completed) can be managed in your Settings → Email preferences." },
];

const SECTIONS = [...new Set(FAQS.map((f) => f.section))];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); } }}
      className="w-full cursor-pointer rounded-2xl border border-white/10 bg-surface p-5 text-left transition hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-[#F2F2F2]">{q}</p>
        <ChevronDownIcon className={`mt-0.5 size-4 shrink-0 text-[#9A9A9A] transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <p className="mt-3 text-sm leading-relaxed text-[#9A9A9A]">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const filtered = activeSection ? FAQS.filter((f) => f.section === activeSection) : FAQS;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16 lg:px-10 space-y-12">

      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-[#F2F2F2]">Frequently asked questions</h1>
        <p className="text-lg text-[#9A9A9A]">
          Everything you need to know about buying and selling on TCGMarket PH.
        </p>
      </div>

      {/* Section filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSection(null)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
            activeSection === null ? "bg-accent text-white" : "border border-white/10 text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]"
          }`}
        >
          All
        </button>
        {SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(activeSection === s ? null : s)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              activeSection === s ? "bg-accent text-white" : "border border-white/10 text-[#9A9A9A] hover:border-white/20 hover:text-[#F2F2F2]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {filtered.map((f) => (
          <FAQItem key={f.q} q={f.q} a={f.a} />
        ))}
      </div>

      {/* Still have questions */}
      <div className="rounded-2xl border border-white/10 bg-surface p-6 text-center">
        <p className="font-semibold text-[#F2F2F2]">Still have questions?</p>
        <p className="mt-2 text-sm text-[#9A9A9A]">
          Reach us at <a href="mailto:support@tcgmarket.ph" className="text-accent hover:underline">support@tcgmarket.ph</a>
          {" "}or check our{" "}
          <Link href="/safety" className="text-accent hover:underline">safety guide</Link>.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/marketplace" className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90">
            Browse marketplace
          </Link>
          <Link href="/signup" className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
            Create free account
          </Link>
        </div>
      </div>

    </div>
  );
}
