import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserCapabilities } from "@/lib/capabilities";
import {
  ShieldCheckIcon,
  PhoneIcon,
  StarIcon,
  TagIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { ChevronUpIcon } from "@heroicons/react/20/solid";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const u = session.user as typeof session.user & {
    displayName?: string | null;
    phone?: string | null;
    phoneVerified?: boolean;
    kycStatus?: string;
    sellerEnabled?: boolean;
    subscriptionTier?: string;
    reputationScore?: number;
    isAdmin?: boolean;
    city?: string | null;
    bio?: string | null;
    games?: string | null;
    createdAt?: string | Date;
  };

  // Redirect to profile setup if city not set (first-time login)
  if (!u.city) redirect("/profile-setup");

  const caps = await getUserCapabilities(u.id);

  const displayName = u.name;
  const memberSince = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString("en-PH", { month: "long", year: "numeric" })
    : "—";
  const reputationScore = u.reputationScore ?? 0;
  const games = u.games ? u.games.split(",").filter(Boolean) : [];

  // Profile completion steps
  const steps = [
    { label: "Account created", done: true },
    { label: "Profile set up",  done: !!(u.city && u.bio) },
    { label: "Phone verified",  done: !!u.phoneVerified, href: "/profile-setup" },
    { label: "KYC verified",    done: u.kycStatus === "verified", href: "#", disabled: true },
    { label: "Seller enabled",  done: !!u.sellerEnabled, href: "#", disabled: true },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const progressPct = Math.round((completedSteps / steps.length) * 100);
  const isComplete = completedSteps === steps.length;

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-8 lg:px-10">

      {/* ── Welcome header ───────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F2F2F2]">
            Welcome back, {displayName} 👋
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#9A9A9A]">
            <span>Member since {memberSince}</span>
            {u.city && <span>· 📍 {u.city}</span>}
            {games.map((g) => (
              <span key={g} className="rounded-full bg-surface border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#9A9A9A]">
                {g === "pokemon" ? "⚡ Pokémon" : g === "one_piece" ? "☠️ One Piece" : g}
              </span>
            ))}
            {caps.isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                <ShieldCheckIcon className="size-3" /> Admin
              </span>
            )}
          </p>
        </div>
        <a
          href="/profile-setup"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
        >
          Edit Profile
        </a>
      </div>

      {/* ── Profile completion banner (hide once complete) ────────── */}
      {!isComplete && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#F2F2F2]">Complete your profile</p>
              <p className="mt-0.5 text-xs text-[#9A9A9A]">
                {completedSteps} of {steps.length} steps done
              </p>
            </div>
            <span className="text-sm font-bold text-accent">{progressPct}%</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Steps */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step) => (
              <div
                key={step.label}
                className={[
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                  step.done
                    ? "bg-bid/10 text-bid"
                    : "border border-white/10 bg-surface2 text-[#9A9A9A]",
                ].join(" ")}
              >
                {step.done ? (
                  <CheckCircleIcon className="size-3.5 shrink-0" />
                ) : (
                  <ClockIcon className="size-3.5 shrink-0" />
                )}
                {step.label}
                {!step.done && !step.disabled && step.href && (
                  <a href={step.href} className="ml-auto text-accent hover:underline">
                    <ArrowRightIcon className="size-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats row ────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Reputation",
            value: reputationScore.toString(),
            sub: "points",
            icon: StarIcon,
            color: "text-yellow-400",
          },
          {
            label: "Phone",
            value: caps.canList ? "Verified" : "Not verified",
            sub: caps.canList ? "Can list cards" : "Verify to list",
            icon: PhoneIcon,
            color: caps.canList ? "text-bid" : "text-[#9A9A9A]",
          },
          {
            label: "KYC",
            value:
              u.kycStatus === "verified"
                ? "Verified"
                : u.kycStatus === "pending"
                ? "Pending"
                : "Not started",
            sub: "Identity check",
            icon: ShieldCheckIcon,
            color:
              u.kycStatus === "verified"
                ? "text-bid"
                : u.kycStatus === "pending"
                ? "text-yellow-400"
                : "text-[#9A9A9A]",
          },
          {
            label: "Seller",
            value: caps.canSell
              ? u.subscriptionTier === "power_seller"
                ? "Power Seller"
                : "Enabled"
              : "Not enabled",
            sub: caps.canSell ? "Active seller" : "Coming soon",
            icon: TagIcon,
            color: caps.canSell ? "text-bid" : "text-[#9A9A9A]",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-surface p-5 transition-all hover:border-white/20"
            >
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-accent/5 blur-2xl transition-all group-hover:bg-accent/10" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Icon className={`size-4 ${stat.color}`} />
                  <p className="text-xs font-medium uppercase tracking-widest text-[#9A9A9A]">
                    {stat.label}
                  </p>
                </div>
                <p className="mt-2 text-xl font-bold tracking-tight text-[#F2F2F2]">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-[#9A9A9A]">{stat.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "Browse Marketplace",
            desc: "Explore Pokémon, One Piece, MTG, and more.",
            href: "#",
            disabled: true,
            badge: "Coming soon",
          },
          {
            title: "Verify Phone",
            desc: "Add your mobile number to unlock listing features.",
            href: "/profile-setup",
            disabled: caps.canList,
            badge: caps.canList ? "Done" : undefined,
          },
          {
            title: "Become a Seller",
            desc: "Complete KYC to start selling your cards.",
            href: "#",
            disabled: true,
            badge: "Coming soon",
          },
        ].map((action) => (
          <a
            key={action.title}
            href={action.disabled && !action.href.startsWith("/profile") ? "#" : action.href}
            className={[
              "group relative flex flex-col rounded-2xl border bg-surface p-5 transition-all",
              action.disabled
                ? "cursor-not-allowed border-white/5 opacity-60"
                : "border-white/10 hover:border-accent/30 hover:shadow-lg hover:shadow-black/30",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#F2F2F2]">{action.title}</p>
              {action.badge && (
                <span className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  action.badge === "Done"
                    ? "bg-bid/10 text-bid"
                    : "bg-surface2 text-[#9A9A9A]",
                ].join(" ")}>
                  {action.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#9A9A9A]">{action.desc}</p>
            {!action.disabled && (
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Get started <ChevronUpIcon className="size-3 rotate-90" />
              </div>
            )}
          </a>
        ))}
      </div>

    </div>
  );
}
