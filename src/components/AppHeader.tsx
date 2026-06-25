"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { BellIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { UserMenu } from "./UserMenu";
import { useCurrencyStore, type Currency } from "@/store/currency";
import { CurrencySync } from "./CurrencySync";

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
  { label: "Dashboard",    href: "/dashboard"    },
  { label: "Browse",       href: "/browse"       },
  { label: "Marketplace",  href: "/marketplace"  },
  { label: "Collection",   href: "/collection"   },
  { label: "Wishlist",     href: "/wishlist"     },
  { label: "Listings",     href: "/listings"     },
  { label: "Transactions", href: "/transactions" },
];

export function AppHeader({ user, preferredCurrency }: AppHeaderProps) {
  const pathname              = usePathname();
  const [open, setOpen]       = useState(false);
  const { currency, setCurrency } = useCurrencyStore();

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  function handleCurrencyToggle() {
    const next: Currency = currency === "PHP" ? "USD" : "PHP";
    setCurrency(next);
    // Persist to DB — fire and forget
    fetch("/api/account/currency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: next }),
    });
  }

  return (
    <>
      {/* Sync DB preference → Zustand on every page load */}
      <CurrencySync currency={preferredCurrency} />

      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-primary/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-6 px-6 lg:px-10">

          {/* Logo */}
          <Link href="/dashboard" className="shrink-0 text-xl font-extrabold tracking-tight text-accent">
            TCGMarket
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
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
          </nav>

          {/* Right */}
          <div className="ml-auto flex items-center gap-2">
            {/* Currency toggle */}
            <button
              onClick={handleCurrencyToggle}
              title={currency === "PHP" ? "Switch to USD" : "Switch to PHP"}
              className="flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-surface px-2.5 text-xs font-bold text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
            >
              <span className={currency === "PHP" ? "text-[#F2F2F2]" : ""}>₱</span>
              <span className="text-white/20">/</span>
              <span className={currency === "USD" ? "text-[#F2F2F2]" : ""}>$</span>
            </button>

            <button
              className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
              aria-label="Notifications"
            >
              <BellIcon className="size-5" />
            </button>

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
            <nav className="flex flex-col gap-1">
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
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
