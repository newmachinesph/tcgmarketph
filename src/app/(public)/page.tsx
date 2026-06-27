import Link from "next/link";
import {
  ShieldCheckIcon,
  BoltIcon,
  ChatBubbleLeftRightIcon,
  BellAlertIcon,
  StarIcon,
  TagIcon,
  CheckCircleIcon,
  MapPinIcon,
  UserGroupIcon,
  ArrowRightIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { TCGCardImage } from "@/components/TCGCardImage";

// ── Card data ──────────────────────────────────────────────────────────────────
// Pokemon TCG images: https://images.pokemontcg.io/{setId}/{num}_hires.png
// One Piece images:   https://en.onepiece-cardgame.com/images/cardlist/card/{id}.png

const HERO_CARDS = [
  {
    name:       "Umbreon VMAX",
    price:      "₱8,500",
    priceColor: "text-purple-400",
    badge:      "BGS 9.5",
    badgeClass: "bg-purple-400/20 text-purple-400",
    image:      "/cards/pokemon/swsh7-215.png",
    rotation:   "-rotate-12",
    translate:  "-translate-x-24",
    size:       "w-32",
    ring:       "ring-1 ring-white/10",
    z:          "z-10",
  },
  {
    name:       "Charizard ex",
    price:      "₱12,500",
    priceColor: "text-accent",
    badge:      "PSA 10",
    badgeClass: "bg-yellow-400/20 text-yellow-300",
    image:      "/cards/pokemon/sv3-228.png",
    rotation:   "rotate-0",
    translate:  "translate-x-0",
    size:       "w-44",
    ring:       "ring-2 ring-white/20",
    z:          "z-20",
  },
  {
    name:       "Pikachu VMAX",
    price:      "₱3,800",
    priceColor: "text-yellow-400",
    badge:      "Near Mint",
    badgeClass: "bg-bid/20 text-bid",
    image:      "/cards/pokemon/swsh6-188.png",
    rotation:   "rotate-12",
    translate:  "translate-x-24",
    size:       "w-32",
    ring:       "ring-1 ring-white/10",
    z:          "z-10",
  },
] as const;

const POKEMON_CARDS = [
  { img: "/cards/pokemon/sv3-228.png",    name: "Charizard ex SIR", price: "₱12,500", featured: false },
  { img: "/cards/pokemon/swsh7-215.png",  name: "Umbreon VMAX AA",  price: "₱8,500",  featured: true  },
  { img: "/cards/pokemon/swsh7-74.png",   name: "Rayquaza VMAX AA", price: "₱6,200",  featured: false },
];

const OP_CARDS = [
  { img: "/cards/op/OP01-001.png", name: "Monkey D. Luffy", price: "₱4,500",  featured: false },
  { img: "/cards/op/OP01-120.png", name: "Shanks",          price: "₱18,000", featured: true  },
  { img: "/cards/op/OP02-001.png", name: "Trafalgar Law",   price: "₱3,200",  featured: false },
];

const FEATURES = [
  { icon: ShieldCheckIcon,         title: "Verified Sellers",  body: "Every seller verifies their Philippine mobile number before listing. No anonymous accounts.", color: "text-bid",       bg: "bg-bid/10",       href: undefined },
  { icon: BoltIcon,                title: "Live Auctions",     body: "Bid in real-time with anti-snipe protection. Auctions auto-extend when bids arrive in the final 30 seconds.", color: "text-accent",    bg: "bg-accent/10",    href: "/auction" },
  { icon: TagIcon,                 title: "Make Offers",       body: "Don't like the price? Send a counter-offer. Sellers can accept, decline, or counter back.", color: "text-yellow-400", bg: "bg-yellow-400/10", href: undefined },
  { icon: BellAlertIcon,           title: "Wishlist Alerts",   body: "Add cards to your wishlist and get notified the moment a seller lists one — before anyone else.", color: "text-purple-400", bg: "bg-purple-400/10", href: undefined },
  { icon: StarIcon,                title: "Reputation System", body: "Buyers and sellers rate each other after every deal. No-shows are tracked and flagged automatically.", color: "text-yellow-400", bg: "bg-yellow-400/10", href: undefined },
  { icon: ChatBubbleLeftRightIcon, title: "In-App Messaging",  body: "Negotiate, confirm meetup details, and coordinate entirely inside the platform — no sharing personal numbers.", color: "text-sky-400",   bg: "bg-sky-400/10",   href: undefined },
];

const STEPS = [
  { step: "01", icon: "🔍", title: "Browse & Find",           body: "Search thousands of Pokémon and One Piece cards. Filter by condition, price, game, and more." },
  { step: "02", icon: "💬", title: "Connect with the Seller", body: "Message the seller directly, make an offer, or place a bid — all without leaving the platform." },
  { step: "03", icon: "🤝", title: "Meet & Trade",            body: "Agree on a public meetup spot, exchange card for cash, then rate each other. Simple and safe." },
];

const TRUST = [
  { icon: MapPinIcon,      title: "Public Meetup Only",  body: "All trades happen face-to-face in public places. No shipping, no scams." },
  { icon: UserGroupIcon,   title: "Community Moderated", body: "Reports reviewed by admins. Bad actors are banned from the platform." },
  { icon: CheckCircleIcon, title: "Transparent Ratings", body: "Every completed deal adds to your public reputation score visible to all buyers." },
];

// ── Sub-component — isolated so client `onError` stays out of the server tree
function GameCardTile({ card, accentColor }: {
  card: { img: string; name: string; price: string; featured: boolean };
  accentColor: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl ring-1 ring-white/10 shadow-xl shadow-black/50 transition hover:-translate-y-1 ${card.featured ? "w-28 -translate-y-3" : "w-24"}`}>
      <TCGCardImage src={card.img} alt={card.name} className="w-full" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5">
        <p className="truncate text-[8px] font-semibold text-white">{card.name}</p>
        <p className={`text-[9px] font-bold ${accentColor}`}>{card.price}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-14 lg:px-10 lg:pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-accent/8 blur-[140px]" />
        </div>

        <div className="relative mx-auto grid max-w-screen-xl items-center gap-14 lg:grid-cols-2 lg:gap-10">
          {/* Text */}
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
              🇵🇭 Made for Filipino card players
            </span>

            <h1 className="font-display mt-5 text-4xl font-bold tracking-tight text-[#F2F2F2] sm:text-5xl lg:text-[3.5rem] lg:leading-tight">
              Buy &amp; Sell TCG Cards{" "}
              <span className="text-accent">in the Philippines</span>
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-[#9A9A9A]">
              The safest cash-on-meetup marketplace for Pokémon, One Piece TCG, and more.
              Verified sellers, live auctions, real-time chat — zero fees.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/signup" className="rounded-xl bg-accent px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-accent/20 transition hover:bg-accent/90 active:scale-95">
                Start Selling Free →
              </Link>
              <Link href="/marketplace" className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-7 py-3.5 text-base font-semibold text-[#F2F2F2] transition hover:border-white/20">
                Browse Marketplace
                <ArrowRightIcon className="size-4 opacity-60" />
              </Link>
              <Link href="/auction" className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-7 py-3.5 text-base font-semibold text-orange-400 transition hover:border-orange-500/50 hover:bg-orange-500/20">
                <FireIcon className="size-5" />
                Live Auctions
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-5 lg:justify-start">
              {["₱0 listing fees", "Verified sellers only", "Cash-on-meetup"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-[#9A9A9A]">
                  <CheckCircleIcon className="size-4 shrink-0 text-bid" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Card fan */}
          <div className="relative mx-auto flex h-[22rem] w-full max-w-sm items-center justify-center lg:max-w-none">
            <div className="absolute h-60 w-60 rounded-full bg-accent/15 blur-3xl" />

            {HERO_CARDS.map((card) => (
              <div
                key={card.name}
                className={`absolute ${card.translate} ${card.rotation} ${card.z} transition-transform duration-500 hover:-translate-y-3 hover:scale-105`}
              >
                <div className={`relative ${card.size} overflow-hidden rounded-2xl shadow-2xl shadow-black/70 ${card.ring}`}>
                  <TCGCardImage src={card.image} alt={card.name} className="w-full" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5">
                    <p className="truncate text-[10px] font-semibold text-white">{card.name}</p>
                    <p className={`mt-0.5 text-sm font-bold ${card.priceColor}`}>{card.price}</p>
                    <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${card.badgeClass}`}>
                      {card.badge}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <Link href="/auction" className="absolute right-0 top-6 z-30 rounded-2xl border border-orange-500/30 bg-surface px-3 py-2 shadow-xl shadow-black/40 transition hover:border-orange-500/50">
              <p className="text-[9px] font-bold uppercase tracking-widest text-orange-400">🔴 Live Auction</p>
              <p className="mt-0.5 text-sm font-bold text-[#F2F2F2]">₱4,200</p>
              <p className="text-[10px] text-[#9A9A9A]">current bid · tap to bid</p>
            </Link>

            <div className="absolute bottom-10 left-0 z-30 flex items-center gap-2 rounded-2xl border border-bid/20 bg-bid/10 px-3 py-2 shadow-xl shadow-black/40">
              <CheckCircleIcon className="size-4 shrink-0 text-bid" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-bid">Just sold</p>
                <p className="text-[10px] text-[#9A9A9A]">Pikachu ex · ₱2,800</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <section className="border-y border-white/8 bg-surface/40">
        <div className="mx-auto grid max-w-screen-xl grid-cols-2 divide-x divide-white/8 md:grid-cols-4">
          {[
            { value: "₱0",   label: "Listing fee"      },
            { value: "2+",   label: "Games supported"  },
            { value: "100%", label: "Cash on meetup"   },
            { value: "PH",   label: "Philippines only" },
          ].map(({ value, label }) => (
            <div key={label} className="px-8 py-7 text-center">
              <p className="font-display text-3xl font-extrabold text-[#F2F2F2]">{value}</p>
              <p className="mt-1 text-sm text-[#9A9A9A]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Games ────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">Supported games</p>
          <h2 className="font-display text-center text-3xl font-bold text-[#F2F2F2]">Your favourite TCGs, one marketplace</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#9A9A9A]">From budget pulls to PSA 10 grails — every card, every condition.</p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* Pokémon */}
            <div className="overflow-hidden rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 p-7">
              <div className="mb-5">
                <h3 className="font-display text-xl font-bold text-yellow-400">Pokémon TCG</h3>
                <p className="mt-1 text-sm text-[#9A9A9A]">Base Set to Scarlet &amp; Violet</p>
              </div>
              <div className="flex items-end gap-3">
                {POKEMON_CARDS.map((c) => (
                  <GameCardTile key={c.name} card={c} accentColor="text-yellow-400" />
                ))}
                <Link href="/marketplace" className="ml-auto flex flex-col items-center justify-center self-center rounded-xl border border-white/10 bg-surface/60 px-4 py-3 text-center text-xs font-semibold text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
                  <span className="text-xl">→</span>Browse all
                </Link>
              </div>
            </div>

            {/* One Piece */}
            <div className="overflow-hidden rounded-3xl border border-red-400/30 bg-gradient-to-br from-red-500/20 to-red-500/5 p-7">
              <div className="mb-5">
                <h3 className="font-display text-xl font-bold text-red-400">One Piece TCG</h3>
                <p className="mt-1 text-sm text-[#9A9A9A]">All OP sets — EN &amp; JP</p>
              </div>
              <div className="flex items-end gap-3">
                {OP_CARDS.map((c) => (
                  <GameCardTile key={c.name} card={c} accentColor="text-red-400" />
                ))}
                <Link href="/marketplace" className="ml-auto flex flex-col items-center justify-center self-center rounded-xl border border-white/10 bg-surface/60 px-4 py-3 text-center text-xs font-semibold text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
                  <span className="text-xl">→</span>Browse all
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-surface/40 p-7 opacity-50 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#F2F2F2]">More games coming soon</h3>
                  <p className="mt-1 text-sm text-[#9A9A9A]">Yu-Gi-Oh!, Magic: The Gathering, Lorcana, Flesh and Blood…</p>
                </div>
                <span className="text-4xl">🎴</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="bg-surface/30 px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">Simple by design</p>
          <h2 className="font-display text-center text-3xl font-bold text-[#F2F2F2]">How it works</h2>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ step, icon, title, body }) => (
              <div key={step} className="relative rounded-2xl border border-white/8 bg-surface p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-2xl">{icon}</span>
                  <span className="font-display select-none text-4xl font-extrabold leading-none text-white/6">{step}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-[#F2F2F2]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <p className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-[#9A9A9A]">Everything you need</p>
          <h2 className="font-display text-center text-3xl font-bold text-[#F2F2F2]">Built for serious collectors</h2>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body, color, bg, href }) => {
              const inner = (
                <>
                  <div className={`mb-4 inline-flex rounded-xl p-3 ${bg} transition group-hover:scale-110`}>
                    <Icon className={`size-5 ${color}`} />
                  </div>
                  <h3 className="font-display font-semibold text-[#F2F2F2]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">{body}</p>
                  {href && (
                    <p className={`mt-3 text-xs font-semibold ${color}`}>Browse now →</p>
                  )}
                </>
              );
              return href ? (
                <Link key={title} href={href} className="group rounded-2xl border border-white/8 bg-surface p-6 transition hover:border-white/16 hover:bg-surface2 block">
                  {inner}
                </Link>
              ) : (
                <div key={title} className="group rounded-2xl border border-white/8 bg-surface p-6 transition hover:border-white/16 hover:bg-surface2">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="overflow-hidden rounded-3xl border border-white/8 bg-surface">
            <div className="px-8 py-12 text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-bid/30 bg-bid/10 px-4 py-1.5 text-xs font-semibold text-bid">
                <ShieldCheckIcon className="size-3.5" />
                Safety first
              </span>
              <h2 className="font-display mt-4 text-3xl font-bold text-[#F2F2F2]">Trade with confidence</h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-[#9A9A9A]">Every feature is designed to protect both buyer and seller in a cash-on-meetup environment.</p>
            </div>
            <div className="grid divide-y divide-white/8 border-t border-white/8 md:grid-cols-3 md:divide-x md:divide-y-0">
              {TRUST.map(({ icon: Icon, title, body }) => (
                <div key={title} className="px-8 py-10 text-center">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-bid/10">
                    <Icon className="size-6 text-bid" />
                  </div>
                  <h3 className="font-semibold text-[#F2F2F2]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────── */}
      <section className="px-6 pb-24 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="relative overflow-hidden rounded-3xl bg-accent px-8 py-20 text-center">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/8 blur-3xl" />
              <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-black/20 blur-3xl" />
            </div>
            <div className="relative">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/60">Join the community</p>
              <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">Ready to trade? It&apos;s free.</h2>
              <p className="mt-4 text-white/75">No listing fees. No commission. Just connect with other Filipino card players.</p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link href="/signup" className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-accent shadow-lg transition hover:bg-white/90 active:scale-95">
                  Create Free Account
                </Link>
                <Link href="/marketplace" className="rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition hover:border-white/60">
                  Browse first
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
