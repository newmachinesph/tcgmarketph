"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bars3Icon, XMarkIcon, ChevronDownIcon, PlusIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { UserMenu } from "./UserMenu";
import { useCurrencyStore, type Currency } from "@/store/currency";
import { CurrencySync } from "./CurrencySync";
import { MessagesNavItem } from "./MessagesUnread";
import { NotificationsBell } from "./NotificationsBell";
import { authClient } from "@/lib/auth-client";

interface AppHeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    displayName?: string | null;
    isAdmin?: boolean | null;
  };
  preferredCurrency: Currency;
}

const NAV = [
  { label: "Dashboard",   href: "/dashboard",   hot: false },
  { label: "Browse",      href: "/browse",      hot: false },
  { label: "Marketplace", href: "/marketplace", hot: false },
  { label: "Auctions",    href: "/auction",     hot: true  },
  { label: "Sellers",     href: "/sellers",     hot: false },
  { label: "Collection",  href: "/collection",  hot: false },
  { label: "Wishlist",    href: "/wishlist",    hot: false },
];

const ACTIVITY = [
  { label: "My Listings",   href: "/listings"     },
  { label: "Offers",        href: "/offers"       },
  { label: "Transactions",  href: "/transactions" },
  { label: "My Bids",       href: "/bids"         },
];

export function AppHeader({ user, preferredCurrency }: AppHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen]       = useState(false);
  const [actOpen, setActOpen] = useState(false);
  const actRef                = useRef<HTMLDivElement>(null);
  const { currency, setCurrency } = useCurrencyStore();

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  const activityActive = ACTIVITY.some((a) => isActive(a.href));

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close activity dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (actRef.current && !actRef.current.contains(e.target as Node)) setActOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await authClient.signOut();
    window.location.href = "/login";
  }

  function handleCurrencyToggle() {
    const next: Currency = currency === "PHP" ? "USD" : "PHP";
    setCurrency(next);
    fetch("/api/account/currency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: next }),
    });
  }

  function navItemClass(href: string) {
    const active = isActive(href);
    return `flex items-center rounded-lg px-4 py-3 text-sm font-medium transition ${
      active ? "bg-surface text-[#F2F2F2]" : "text-[#9A9A9A] hover:bg-surface hover:text-[#F2F2F2]"
    }`;
  }

  return (
    <>
      <CurrencySync currency={preferredCurrency} />

      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-primary/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-5 px-6 lg:px-10">

          {/* Logo */}
          <Link href="/dashboard" className="shrink-0 text-xl font-extrabold tracking-tight text-accent">
            TCGMarket<span className="text-[#F2F2F2]">PH</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => item.hot ? (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  isActive(item.href) ? "bg-orange-500/20 text-orange-400" : "text-orange-400 hover:bg-orange-500/10"
                }`}
              >
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-orange-400" />
                </span>
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(item.href)
                    ? "bg-surface text-[#F2F2F2]"
                    : "text-[#9A9A9A] hover:bg-surface hover:text-[#F2F2F2]"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Activity dropdown */}
            <div ref={actRef} className="relative">
              <button
                onClick={() => setActOpen((v) => !v)}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activityActive || actOpen
                    ? "bg-surface text-[#F2F2F2]"
                    : "text-[#9A9A9A] hover:bg-surface hover:text-[#F2F2F2]"
                }`}
              >
                Activity
                <ChevronDownIcon className={`size-3.5 transition-transform ${actOpen ? "rotate-180" : ""}`} />
              </button>

              {actOpen && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-white/10 bg-surface shadow-xl shadow-black/40">
                  {ACTIVITY.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActOpen(false)}
                      className={`flex items-center px-4 py-2.5 text-sm transition ${
                        isActive(item.href)
                          ? "bg-surface2 font-semibold text-[#F2F2F2]"
                          : "text-[#9A9A9A] hover:bg-surface2 hover:text-[#F2F2F2]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <MessagesNavItem />

            <Link
              href="/listings/new"
              className="ml-1 flex items-center gap-1.5 rounded-lg bg-bid/15 px-3.5 py-1.5 text-sm font-semibold text-bid ring-1 ring-bid/30 transition hover:bg-bid/25"
            >
              <PlusIcon className="size-3.5" />
              List a Card
            </Link>
          </nav>

          {/* Right */}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleCurrencyToggle}
              title={currency === "PHP" ? "Switch to USD" : "Switch to PHP"}
              className="flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-surface px-2.5 text-xs font-bold text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
            >
              <span className={currency === "PHP" ? "text-[#F2F2F2]" : ""}>₱</span>
              <span className="text-white/20">/</span>
              <span className={currency === "USD" ? "text-[#F2F2F2]" : ""}>$</span>
            </button>

            <NotificationsBell />

            <UserMenu
              name={user.name}
              displayName={user.displayName}
              email={user.email}
              image={user.image}
              isAdmin={user.isAdmin ?? false}
            />

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen(true)}
              className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] lg:hidden"
              aria-label="Open menu"
            >
              <Bars3Icon className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Left-slide drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#111111] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link href="/dashboard" onClick={() => setOpen(false)} className="text-xl font-extrabold tracking-tight text-accent">
            TCGMarket<span className="text-[#F2F2F2]">PH</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="flex size-8 items-center justify-center rounded-lg text-[#9A9A9A] transition hover:text-[#F2F2F2]"
            aria-label="Close menu"
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3 min-h-0">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={item.hot
                ? `flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/10 ${
                    isActive(item.href) ? "bg-orange-500/10" : ""
                  }`
                : navItemClass(item.href)}
            >
              {item.hot && (
                <span className="relative flex size-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-orange-400" />
                </span>
              )}
              {item.label}
            </Link>
          ))}

          {/* Activity section */}
          <div className="mt-1 border-t border-white/5 pt-1">
            <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-white/30">Activity</p>
            {ACTIVITY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={navItemClass(item.href)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-1 border-t border-white/5 pt-1">
            <MessagesNavItem mobile onClick={() => setOpen(false)} />
            <Link
              href="/listings/new"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg bg-bid/15 px-4 py-3 text-sm font-semibold text-bid ring-1 ring-bid/30 transition hover:bg-bid/25"
            >
              <PlusIcon className="size-4" />
              List a Card
            </Link>
          </div>
        </nav>

        {/* Bottom: currency + sign out */}
        <div className="shrink-0 border-t border-white/10 p-3 space-y-1">
          <button
            onClick={() => { handleCurrencyToggle(); setOpen(false); }}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-[#9A9A9A] transition hover:bg-surface hover:text-[#F2F2F2]"
          >
            <span className="font-bold">{currency === "PHP" ? "₱ PHP" : "$ USD"}</span>
            <span className="text-xs text-white/30">— tap to switch</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-[#9A9A9A] transition hover:bg-surface hover:text-[#F2F2F2]"
          >
            <ArrowRightStartOnRectangleIcon className="size-4" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
