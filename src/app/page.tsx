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
} from "@heroicons/react/24/outline";

// ── Stat strip ────────────────────────────────────────────────────────────────

const STATS = [
  { value: "₱0",   label: "Listing fee" },
  { value: "2",    label: "Games supported" },
  { value: "100%", label: "Cash on meetup" },
  { value: "PH",   label: "Philippines only" },
];

// ── Feature cards ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ShieldCheckIcon,
    title: "Verified Sellers",
    body:  "Every seller verifies their Philippine mobile number before listing. No anonymous accounts.",
    color: "text-bid",
    bg:    "bg-bid/10",
  },
  {
    icon: BoltIcon,
    title: "Live Auctions",
    body:  "Bid in real-time with anti-snipe protection. Auctions auto-extend when bids arrive in the final 30 seconds.",
    color: "text-accent",
    bg:    "bg-accent/10",
  },
  {
    icon: TagIcon,
    title: "Make Offers",
    body:  "Don't like the price? Send a counter-offer. Sellers can accept, decline, or counter back.",
    color: "text-yellow-400",
    bg:    "bg-yellow-400/10",
  },
  {
    icon: BellAlertIcon,
    title: "Wishlist Alerts",
    body:  "Add cards to your wishlist and get notified the moment a seller lists one — before anyone else sees it.",
    color: "text-purple-400",
    bg:    "bg-purple-400/10",
  },
  {
    icon: StarIcon,
    title: "Reputation System",
    body:  "Buyers and sellers rate each other after every deal. No-shows are tracked and flagged automatically.",
    color: "text-yellow-400",
    bg:    "bg-yellow-400/10",
  },
  {
    icon: ChatBubbleLeftRightIcon,
    title: "In-App Messaging",
    body:  "Negotiate, confirm meetup details, and coordinate entirely inside the platform — no sharing personal numbers.",
    color: "text-sky-400",
    bg:    "bg-sky-400/10",
  },
];

// ── How it works ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    step: "01",
    title: "Browse & Find",
    body:  "Search thousands of Pokémon and One Piece cards. Filter by condition, price, game, and more.",
  },
  {
    step: "02",
    title: "Connect with the Seller",
    body:  "Message the seller directly, make an offer, or place a bid — all without leaving the platform.",
  },
  {
    step: "03",
    title: "Meet & Trade",
    body:  "Agree on a public meetup spot, exchange card for cash, then rate each other. Simple and safe.",
  },
];

// ── Games ─────────────────────────────────────────────────────────────────────

const GAMES = [
  { name: "Pokémon TCG",  emoji: "⚡", desc: "Base set to Scarlet & Violet", color: "border-yellow-400/30 hover:border-yellow-400/60" },
  { name: "One Piece TCG", emoji: "⚓", desc: "All OP sets, EN & JP",         color: "border-red-400/30 hover:border-red-400/60" },
];

// ── Trust signals ─────────────────────────────────────────────────────────────

const TRUST = [
  { icon: MapPinIcon,    title: "Public Meetup Only",    body: "All trades happen face-to-face in public places. No shipping, no scams." },
  { icon: UserGroupIcon, title: "Community Moderated",   body: "Reports reviewed by admins. Bad actors are banned from the platform." },
  { icon: CheckCircleIcon, title: "Transparent Ratings", body: "Every completed deal adds to your public reputation score visible to all buyers." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-primary text-[#F2F2F2]">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/8 bg-primary/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-accent font-display">
            TCGMarket<span className="text-[#F2F2F2]">PH</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[#9A9A9A] md:flex">
            <a href="#features" className="transition hover:text-[#F2F2F2]">Features</a>
            <a href="#how-it-works" className="transition hover:text-[#F2F2F2]">How it works</a>
            <a href="#games" className="transition hover:text-[#F2F2F2]">Games</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#9A9A9A] transition hover:text-[#F2F2F2] sm:block">
              Sign in
            </Link>
            <Link href="/signup"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90">
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 text-center lg:px-10 lg:pt-28">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center">
          <div className="mt-8 h-[400px] w-[700px] rounded-full bg-accent/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
            🇵🇭 Made for Filipino card players
          </span>
          <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-[#F2F2F2] sm:text-5xl lg:text-6xl">
            Buy & Sell TCG Cards{" "}
            <span className="text-accent">in the Philippines</span>
          </h1>
          <p className="mt-6 text-lg text-[#9A9A9A] sm:text-xl">
            The safest cash-on-meetup marketplace for Pokémon, One Piece, and more.
            Verified sellers, live auctions, real-time chat — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup"
              className="rounded-xl bg-accent px-6 py-3 text-base font-bold text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90">
              Start Selling Free →
            </Link>
            <Link href="/login"
              className="rounded-xl border border-white/10 bg-surface px-6 py-3 text-base font-semibold text-[#F2F2F2] transition hover:border-white/20">
              Browse Marketplace
            </Link>
          </div>
        </div>

        {/* Card grid decoration */}
        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="flex items-end justify-center gap-3">
            {[
              { label: "Charizard ex", price: "₱12,500", badge: "PSA 10", bClass: "bg-yellow-400/20 text-yellow-400" },
              { label: "Monkey D. Luffy", price: "₱3,200", badge: "Near Mint", bClass: "bg-bid/20 text-bid", tall: true },
              { label: "Pikachu VMAX", price: "₱2,800", badge: "Auction", bClass: "bg-accent/20 text-accent" },
            ].map((card) => (
              <div key={card.label}
                className={`w-36 rounded-2xl border border-white/10 bg-surface p-3 shadow-2xl shadow-black/40 transition hover:-translate-y-1 ${card.tall ? "mb-4" : ""}`}>
                <div className="aspect-[2/3] w-full rounded-xl bg-surface2 flex items-center justify-center text-4xl">
                  🃏
                </div>
                <div className="mt-2">
                  <p className="truncate text-[11px] font-semibold text-[#F2F2F2]">{card.label}</p>
                  <p className="mt-0.5 text-xs font-bold text-accent">{card.price}</p>
                  <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${card.bClass}`}>
                    {card.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Fade bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary to-transparent" />
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section className="border-y border-white/8 bg-surface/50">
        <div className="mx-auto grid max-w-screen-xl grid-cols-2 divide-x divide-white/8 md:grid-cols-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="px-8 py-6 text-center">
              <p className="font-display text-3xl font-bold text-[#F2F2F2]">{value}</p>
              <p className="mt-1 text-sm text-[#9A9A9A]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Games ───────────────────────────────────────────────────────── */}
      <section id="games" className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">
            Supported games
          </p>
          <h2 className="font-display text-center text-3xl font-bold text-[#F2F2F2]">
            Your favourite TCGs, one marketplace
          </h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {GAMES.map((g) => (
              <div key={g.name}
                className={`flex items-center gap-4 rounded-2xl border bg-surface px-8 py-5 transition ${g.color}`}>
                <span className="text-4xl">{g.emoji}</span>
                <div>
                  <p className="font-semibold text-[#F2F2F2]">{g.name}</p>
                  <p className="text-sm text-[#9A9A9A]">{g.desc}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-surface px-8 py-5 opacity-50">
              <span className="text-4xl">🎴</span>
              <div>
                <p className="font-semibold text-[#F2F2F2]">More coming soon</p>
                <p className="text-sm text-[#9A9A9A]">Yu-Gi-Oh!, MTG, Lorcana…</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">
            Everything you need
          </p>
          <h2 className="font-display text-center text-3xl font-bold text-[#F2F2F2]">
            Built for serious collectors
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body, color, bg }) => (
              <div key={title}
                className="rounded-2xl border border-white/8 bg-surface p-6 transition hover:border-white/16">
                <div className={`mb-4 inline-flex rounded-xl p-2.5 ${bg}`}>
                  <Icon className={`size-5 ${color}`} />
                </div>
                <h3 className="font-display font-semibold text-[#F2F2F2]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">
            Simple by design
          </p>
          <h2 className="font-display text-center text-3xl font-bold text-[#F2F2F2]">
            How it works
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ step, title, body }) => (
              <div key={step} className="relative rounded-2xl border border-white/8 bg-surface p-8">
                <span className="font-display text-5xl font-extrabold text-white/5 select-none">
                  {step}
                </span>
                <h3 className="font-display mt-2 text-xl font-bold text-[#F2F2F2]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="overflow-hidden rounded-3xl border border-white/8 bg-surface">
            <div className="px-8 py-10 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Safety first</p>
              <h2 className="font-display text-3xl font-bold text-[#F2F2F2]">
                Trade with confidence
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-[#9A9A9A]">
                Every feature is designed to protect both buyer and seller in a cash-on-meetup environment.
              </p>
            </div>
            <div className="grid divide-y divide-white/8 border-t border-white/8 md:grid-cols-3 md:divide-x md:divide-y-0">
              {TRUST.map(({ icon: Icon, title, body }) => (
                <div key={title} className="px-8 py-8 text-center">
                  <Icon className="mx-auto mb-3 size-7 text-bid" />
                  <h3 className="font-semibold text-[#F2F2F2]">{title}</h3>
                  <p className="mt-2 text-sm text-[#9A9A9A]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="relative overflow-hidden rounded-3xl bg-accent px-8 py-16 text-center">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-black/20 blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                Ready to trade? Join free.
              </h2>
              <p className="mt-3 text-white/80">
                No listing fees. No commission. Just connect with other Filipino card players.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/signup"
                  className="rounded-xl bg-white px-6 py-3 text-base font-bold text-accent transition hover:bg-white/90">
                  Create Free Account
                </Link>
                <Link href="/login"
                  className="rounded-xl border border-white/30 px-6 py-3 text-base font-semibold text-white transition hover:border-white/60">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/8 px-6 py-12 lg:px-10">
        <div className="mx-auto max-w-screen-xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="font-display text-xl font-extrabold text-accent tracking-tight">
                TCGMarket<span className="text-[#F2F2F2]">PH</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm text-[#9A9A9A]">
                The Philippines' premier cash-on-meetup marketplace for trading card games.
              </p>
              <p className="mt-4 text-xs text-white/30">
                © {new Date().getFullYear()} TCGMarket PH. All rights reserved.
              </p>
            </div>

            {/* Marketplace */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Marketplace</p>
              <ul className="space-y-2 text-sm text-[#9A9A9A]">
                <li><Link href="/login" className="transition hover:text-[#F2F2F2]">Browse Cards</Link></li>
                <li><Link href="/login" className="transition hover:text-[#F2F2F2]">Sell a Card</Link></li>
                <li><Link href="/login" className="transition hover:text-[#F2F2F2]">Live Auctions</Link></li>
                <li><Link href="/login" className="transition hover:text-[#F2F2F2]">My Wishlist</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Account</p>
              <ul className="space-y-2 text-sm text-[#9A9A9A]">
                <li><Link href="/signup" className="transition hover:text-[#F2F2F2]">Sign Up Free</Link></li>
                <li><Link href="/login"  className="transition hover:text-[#F2F2F2]">Sign In</Link></li>
                <li><Link href="/login"  className="transition hover:text-[#F2F2F2]">Dashboard</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
