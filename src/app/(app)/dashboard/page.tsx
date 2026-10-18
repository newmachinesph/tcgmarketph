import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, desc, count, sum, sql, and } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userCollection, userWishlist, cardCatalog } from "@/db/schema/cards";
import { listings } from "@/db/schema/listings";
import { getUserCapabilities } from "@/lib/capabilities";
import {
  ShieldCheckIcon,
  PhoneIcon,
  StarIcon,
  TagIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  RectangleStackIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import { CardImage } from "@/components/CardImage";
import { Price } from "@/components/Price";
import { GAME_LABEL } from "@/lib/constants/games";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const u = session.user;

  if (!u.city) redirect("/profile-setup");

  // Fetch everything in parallel
  const [caps, collectionStats, wishlistStats, recentCards, collectionValue, listingCount] = await Promise.all([
    getUserCapabilities(u.id),

    // Collection: total quantity
    db
      .select({
        totalCards: sum(userCollection.quantity).mapWith(Number),
        totalEntries: count(userCollection.id),
      })
      .from(userCollection)
      .where(eq(userCollection.userId, u.id))
      .then((r) => r[0] ?? { totalCards: 0, totalEntries: 0 }),

    // Wishlist: total + high priority count
    db
      .select({
        total: count(userWishlist.id),
        highPriority: sql<number>`count(*) filter (where ${userWishlist.priority} = 'high')`.mapWith(Number),
      })
      .from(userWishlist)
      .where(eq(userWishlist.userId, u.id))
      .then((r) => r[0] ?? { total: 0, highPriority: 0 }),

    // 4 most recently added collection entries + card info
    db
      .select({ entry: userCollection, card: cardCatalog })
      .from(userCollection)
      .innerJoin(cardCatalog, eq(userCollection.cardId, cardCatalog.id))
      .where(eq(userCollection.userId, u.id))
      .orderBy(desc(userCollection.createdAt))
      .limit(4),

    // Estimated collection value (USD, from market prices)
    db
      .select({ value: sql<number>`sum(${userCollection.quantity} * ${cardCatalog.marketPrice}::numeric)`.mapWith(Number) })
      .from(userCollection)
      .innerJoin(cardCatalog, eq(userCollection.cardId, cardCatalog.id))
      .where(eq(userCollection.userId, u.id))
      .then((r) => r[0]?.value ?? 0),

    // Has the user ever created a listing?
    db
      .select({ n: count(listings.id) })
      .from(listings)
      .where(eq(listings.sellerId, u.id))
      .then((r) => r[0]?.n ?? 0),
  ]);

  const displayName = u.name;
  const memberSince = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString("en-PH", { month: "long", year: "numeric" })
    : "—";
  const games = u.games ? u.games.split(",").filter(Boolean) : [];

  // Profile completion
  const steps = [
    { label: "Account created",    done: true },
    { label: "Profile set up",     done: !!(u.city && u.bio), href: "/profile-setup" },
    { label: "Phone verified",     done: !!u.phoneVerified,   href: "/verify" },
    { label: "Identity verified",  done: u.kycStatus === "verified", href: "/verify",
      subLabel: u.kycStatus === "pending" ? "Review in progress…" :
                u.kycStatus === "rejected" ? "Declined — retry in Profile" : undefined },
    { label: "List your first card", done: listingCount > 0, href: "/listings/new" },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const progressPct    = Math.round((completedSteps / steps.length) * 100);
  const isComplete     = completedSteps === steps.length;

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-8 lg:px-10 space-y-6">

      {/* ── Welcome header ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#9A9A9A]">
            <span>Member since {memberSince}</span>
            {u.city && <span>· {u.city}</span>}
            {games.map((g) => (
              <span key={g} className="rounded-full border border-white/10 bg-surface px-2 py-0.5 text-[10px] font-semibold text-[#9A9A9A]">
                {GAME_LABEL[g] ?? g}
              </span>
            ))}
            {caps.isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                <ShieldCheckIcon className="size-3" /> Admin
              </span>
            )}
          </p>
        </div>
        <Link href="/profile"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]">
          Edit Profile
        </Link>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-white/10">
        {[
          { label: "Overview",  href: "/dashboard" },
          { label: "Analytics", href: "/dashboard?tab=analytics" },
        ].map(({ label, href }) => {
          const active = label === "Analytics" ? tab === "analytics" : !tab || tab === "overview";
          return (
            <Link
              key={label}
              href={href}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                active
                  ? "border-accent text-[#F2F2F2]"
                  : "border-transparent text-[#9A9A9A] hover:text-[#F2F2F2]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {tab === "analytics" && <AnalyticsDashboard />}

      {tab !== "analytics" && (<>

      {/* ── TCG collection stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Collection */}
        <Link href="/collection"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-accent/30">
          <div className="absolute -right-6 -top-6 size-24 rounded-full bg-accent/5 blur-2xl transition group-hover:bg-accent/10" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#9A9A9A]">Collection</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F2F2F2]">
                {(collectionStats.totalCards ?? 0).toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-[#9A9A9A]">
                {collectionStats.totalEntries} {collectionStats.totalEntries === 1 ? "entry" : "entries"}
                {collectionValue > 0 && <> · est. <Price usd={collectionValue} /></>}
              </p>
            </div>
            <RectangleStackIcon className="size-6 text-accent/60" />
          </div>
          <p className="mt-4 flex items-center gap-1 text-xs font-semibold text-accent opacity-0 transition group-hover:opacity-100">
            View collection <ChevronUpIcon className="size-3 rotate-90" />
          </p>
        </Link>

        {/* Wishlist */}
        <Link href="/wishlist"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-sky-400/30">
          <div className="absolute -right-6 -top-6 size-24 rounded-full bg-sky-400/5 blur-2xl transition group-hover:bg-sky-400/10" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#9A9A9A]">Wishlist</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F2F2F2]">
                {(wishlistStats.total ?? 0).toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-[#9A9A9A]">
                {wishlistStats.highPriority > 0
                  ? `${wishlistStats.highPriority} high priority`
                  : "cards wanted"}
              </p>
            </div>
            <BookmarkIcon className="size-6 text-sky-400/60" />
          </div>
          <p className="mt-4 flex items-center gap-1 text-xs font-semibold text-sky-400 opacity-0 transition group-hover:opacity-100">
            View wishlist <ChevronUpIcon className="size-3 rotate-90" />
          </p>
        </Link>

        {/* Browse */}
        <Link href="/browse"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-surface p-5 transition hover:border-purple-400/30">
          <div className="absolute -right-6 -top-6 size-24 rounded-full bg-purple-400/5 blur-2xl transition group-hover:bg-purple-400/10" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#9A9A9A]">Browse</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F2F2F2]">Cards</p>
              <p className="mt-0.5 text-xs text-[#9A9A9A]">Pokémon · One Piece</p>
            </div>
            <MagnifyingGlassIcon className="size-6 text-purple-400/60" />
          </div>
          <p className="mt-4 flex items-center gap-1 text-xs font-semibold text-purple-400 opacity-0 transition group-hover:opacity-100">
            Search cards <ChevronUpIcon className="size-3 rotate-90" />
          </p>
        </Link>
      </div>

      {/* ── Recently added to collection ─────────────────────────────────── */}
      {recentCards.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F2F2F2]">Recently Added</h2>
            <Link href="/collection" className="text-xs text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recentCards.map(({ entry, card }) => (
              <Link key={entry.id} href="/collection"
                className="group flex items-center gap-3 rounded-xl border border-white/8 bg-surface p-3 transition hover:border-white/16">
                <div className="h-12 w-9 shrink-0 overflow-hidden rounded-md">
                  <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#F2F2F2]">{card.name}</p>
                  <p className="truncate text-[10px] text-[#9A9A9A]">
                    {card.setName ?? GAME_LABEL[card.game] ?? card.game}
                  </p>
                  <p className="text-[10px] text-[#9A9A9A]">×{entry.quantity}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Seller onboarding banner ──────────────────────────────────────── */}
      {!isComplete && (
        <div className="rounded-2xl border border-white/10 bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#F2F2F2]">Get started as a seller</p>
              <p className="mt-0.5 text-xs text-[#9A9A9A]">{completedSteps} of {steps.length} steps done</p>
            </div>
            <span className="text-sm font-bold text-accent">{progressPct}%</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step) => {
              const inner = (
                <>
                  <div className="flex items-center gap-2">
                    {step.done
                      ? <CheckCircleIcon className="size-3.5 shrink-0" />
                      : <ClockIcon className="size-3.5 shrink-0" />}
                    <span className="flex-1 leading-tight">{step.label}</span>
                    {!step.done && step.href && <ArrowRightIcon className="size-3 shrink-0 text-accent" />}
                  </div>
                  {step.subLabel && !step.done && (
                    <p className="pl-5 text-[10px] leading-tight opacity-70">{step.subLabel}</p>
                  )}
                </>
              );
              const cls = `flex flex-col gap-1 rounded-lg px-3 py-2 text-xs font-medium transition ${
                step.done
                  ? "bg-bid/10 text-bid"
                  : step.href
                  ? "border border-white/10 bg-surface2 text-[#9A9A9A] hover:border-accent/30 hover:text-[#F2F2F2] cursor-pointer"
                  : "border border-white/10 bg-surface2 text-[#9A9A9A]"
              }`;
              return !step.done && step.href ? (
                <a key={step.label} href={step.href} className={cls}>{inner}</a>
              ) : (
                <div key={step.label} className={cls}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Account stats ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Reputation", value: (u.reputationScore ?? 0).toString(), sub: "points", icon: StarIcon, color: "text-yellow-400" },
          { label: "Phone", value: caps.canList ? "Verified" : "Not verified", sub: caps.canList ? "Can list cards" : "Verify to list", icon: PhoneIcon, color: caps.canList ? "text-bid" : "text-[#9A9A9A]" },
          { label: "KYC", value: u.kycStatus === "verified" ? "Verified" : u.kycStatus === "pending" ? "Pending" : "Not started", sub: "Identity check", icon: ShieldCheckIcon, color: u.kycStatus === "verified" ? "text-bid" : u.kycStatus === "pending" ? "text-yellow-400" : "text-[#9A9A9A]" },
          { label: "Seller", value: caps.canSell ? (u.subscriptionTier === "power_seller" ? "Power Seller" : "Enabled") : "Not enabled", sub: caps.canSell ? "Active seller" : "Verify phone to sell", icon: TagIcon, color: caps.canSell ? "text-bid" : "text-[#9A9A9A]" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-surface p-5 transition hover:border-white/20">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-accent/5 blur-2xl transition group-hover:bg-accent/10" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Icon className={`size-4 ${stat.color}`} />
                  <p className="text-xs font-medium uppercase tracking-widest text-[#9A9A9A]">{stat.label}</p>
                </div>
                <p className="mt-2 text-xl font-bold tracking-tight text-[#F2F2F2]">{stat.value}</p>
                <p className="mt-0.5 text-xs text-[#9A9A9A]">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      </>)}

    </div>
  );
}
