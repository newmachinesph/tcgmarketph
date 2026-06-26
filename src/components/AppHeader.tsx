"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { UserMenu } from "./UserMenu";
import { useCurrencyStore, type Currency } from "@/store/currency";
import { CurrencySync } from "./CurrencySync";
import { MessagesNavItem } from "./MessagesUnread";
import { NotificationsBell } from "./NotificationsBell";

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

// Primary nav items — always visible on desktop
const NAV = [
  { label: "Dashboard",   href: "/dashboard"   },
  { label: "Browse",      href: "/browse"      },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Sellers",     href: "/sellers"     },
  { label: "Collection",  href: "/collection"  },
  { label: "Wishlist",    href: "/wishlist"    },
];

// Items grouped under "Activity" dropdown
const ACTIVITY = [
  { label: "My Listings",   href: "/listings"     },
  { label: "Offers",        href: "/offers"       },
  { label: "Transactions",  href: "/transactions" },
  { label: "My Bids",       href: "/bids"         },
];

export function AppHeader({ user, preferredCurrency }: AppHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen]           = useState(false);
  const [actOpen, setActOpen]     = useState(false);
  const actRef                    = useRef<HTMLDivElement>(null);
  const { currency, setCurrency } = useCurrencyStore();

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  const activityActive = ACTIVITY.some((a) => isActive(a.href));

  // Close activity dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (actRef.current && !actRef.current.contains(e.target as Node)) setActOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleCurrencyToggle() {
    const next: Currency = currency === "PHP" ? "USD" : "PHP";
    setCurrency(next);
    fetch("/api/account/currency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: next }),
    });
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
            {NAV.map((item) => (
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

            {/* Mobile menu toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] lg:hidden"
              aria-label="Menu"
            >
              {open ? <XMarkIcon className="size-5" /> : <Bars3Icon className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {open && (
          <div className="border-t border-white/10 bg-primary px-6 py-3 lg:hidden">
            <nav className="flex flex-col gap-0.5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive(item.href)
                      ? "bg-surface text-[#F2F2F2]"
                      : "text-[#9A9A9A] hover:bg-surface hover:text-[#F2F2F2]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {/* Activity section in mobile */}
              <div className="mt-1 border-t border-white/5 pt-1">
                <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/30">Activity</p>
                {ACTIVITY.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium transition block ${
                      isActive(item.href)
                        ? "bg-surface text-[#F2F2F2]"
                        : "text-[#9A9A9A] hover:bg-surface hover:text-[#F2F2F2]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <MessagesNavItem mobile onClick={() => setOpen(false)} />
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
