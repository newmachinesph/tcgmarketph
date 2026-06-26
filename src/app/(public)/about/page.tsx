import Link from "next/link";
import {
  ShieldCheckIcon,
  UserGroupIcon,
  MapPinIcon,
  SparklesIcon,
  HeartIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export const metadata = {
  title: "About — TCGMarket PH",
  description: "The story behind TCGMarket PH — the Philippines' cash-on-meetup marketplace for Pokémon and One Piece trading cards.",
};

const VALUES = [
  {
    icon: ShieldCheckIcon,
    title: "Safety first",
    body: "Every transaction is cash-on-meetup in a public place. No shipping means no package scams, no chargebacks, no lost parcels. Your money and your card exchange face-to-face.",
    color: "text-bid",
    bg: "bg-bid/10",
  },
  {
    icon: UserGroupIcon,
    title: "Community-built",
    body: "TCGMarket PH was built by collectors, for collectors. We understand the hobby because we live it — the thrill of a pull, the pain of a scam, the joy of completing a set.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: HeartIcon,
    title: "Zero fees",
    body: "Listing is free. Selling is free. We make money when the platform grows, not when you trade. No commission, no listing fees, ever.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: SparklesIcon,
    title: "Transparent reputation",
    body: "Every buyer and seller has a public reputation score built from real completed deals. No fake reviews. No hidden ratings. Just honest community feedback.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
];

const TIMELINE = [
  { year: "Jun 2026", event: "TCGMarket PH launched — built by Filipino collectors tired of Facebook group scams. First 100 verified sellers joined in week one." },
  { year: "Jul 2026", event: "One Piece TCG catalog added. Live auction system launched with anti-snipe bid extension." },
  { year: "Aug 2026", event: "KYC verification through Didit and real-time messaging deployed. Reputation scores go live." },
  { year: "Coming soon", event: "iOS & Android app, Yu-Gi-Oh!, Magic: The Gathering, Lorcana support on the roadmap." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-screen-lg px-6 py-16 lg:px-10 space-y-20">

      {/* Hero */}
      <div className="text-center space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
          🇵🇭 Made in the Philippines
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-[#F2F2F2] lg:text-5xl">
          Built for Filipino<br />card collectors
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-[#9A9A9A]">
          TCGMarket PH started with a simple idea: Filipino collectors deserve a safe,
          scam-free place to buy and sell trading cards — without shipping risks, hidden
          fees, or fake accounts.
        </p>
      </div>

      {/* Mission statement */}
      <div className="rounded-3xl border border-white/10 bg-surface p-8 lg:p-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Our mission</p>
        <p className="mt-4 text-2xl font-semibold text-[#F2F2F2] leading-relaxed lg:text-3xl">
          "Make every card trade in the Philippines <span className="text-accent">safe, fair, and free</span> — so the hobby can grow."
        </p>
      </div>

      {/* The problem we solve */}
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">The problem</p>
          <h2 className="mt-2 text-2xl font-bold text-[#F2F2F2]">Filipino TCG trading was broken</h2>
          <div className="mt-4 space-y-3 text-sm text-[#9A9A9A]">
            <p>Facebook groups are full of scammers. Buy-and-block, fake photos, ghost sellers after payment — it's rampant.</p>
            <p>International platforms don't understand Philippine meetup culture. They're built around shipping, which doesn't fit how most Filipino collectors trade.</p>
            <p>There was no platform with identity verification, reputation tracking, and in-app messaging — all designed specifically for cash meetups.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Our solution</p>
          {[
            "Phone + KYC verification before a seller can list",
            "Public reputation scores built from real completed deals",
            "In-app messaging — no need to share personal numbers",
            "Cash-on-meetup model: card and cash exchange simultaneously",
            "Admin moderation and no-show tracking",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-[#F2F2F2]">
              <span className="mt-0.5 text-bid">✓</span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div>
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">What we stand for</p>
        <h2 className="text-center text-2xl font-bold text-[#F2F2F2]">Our values</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, body, color, bg }) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-surface p-6">
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg}`}>
                <Icon className={`size-5 ${color}`} />
              </div>
              <h3 className="font-semibold text-[#F2F2F2]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-[#9A9A9A]">Our story</p>
        <h2 className="text-center text-2xl font-bold text-[#F2F2F2]">How we got here</h2>
        <div className="mt-8 relative">
          <div className="absolute left-12 top-0 bottom-0 w-px bg-white/10 hidden sm:block" />
          <div className="space-y-6">
            {TIMELINE.map(({ year, event }) => (
              <div key={year} className="flex gap-6 items-start">
                <div className="hidden sm:flex shrink-0 size-24 items-center justify-center">
                  <span className="text-sm font-bold text-accent">{year}</span>
                </div>
                <div className="rounded-2xl border border-white/10 bg-surface p-4 flex-1">
                  <p className="text-xs font-bold text-accent sm:hidden">{year}</p>
                  <p className="text-sm text-[#9A9A9A]">{event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Games */}
      <div className="rounded-3xl border border-white/10 bg-surface p-8 text-center">
        <h2 className="text-xl font-bold text-[#F2F2F2]">Games we support</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {[
            { emoji: "⚡", name: "Pokémon TCG", desc: "Base Set to Scarlet & Violet" },
            { emoji: "⚓", name: "One Piece TCG", desc: "All OP sets, EN & JP" },
            { emoji: "🎴", name: "More coming", desc: "Yu-Gi-Oh!, MTG, Lorcana…", dim: true },
          ].map((g) => (
            <div key={g.name} className={`flex items-center gap-3 rounded-2xl border border-white/10 px-6 py-4 ${g.dim ? "opacity-40" : ""}`}>
              <span className="text-3xl">{g.emoji}</span>
              <div className="text-left">
                <p className="font-semibold text-[#F2F2F2]">{g.name}</p>
                <p className="text-xs text-[#9A9A9A]">{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#F2F2F2]">Join the community</h2>
        <p className="text-[#9A9A9A]">Free accounts. No fees. Just a better way to trade cards.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent/90">
            Create free account <ArrowRightIcon className="size-4" />
          </Link>
          <Link href="/marketplace" className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
            Browse marketplace
          </Link>
        </div>
      </div>

    </div>
  );
}
