"use client";

import { useState } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const NAV = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Sellers",     href: "/sellers"     },
  { label: "About",       href: "/about"       },
  { label: "Safety",      href: "/safety"      },
  { label: "FAQ",         href: "/faq"         },
];

export function PublicMobileMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] lg:hidden"
        aria-label="Menu"
      >
        {open ? <XMarkIcon className="size-5" /> : <Bars3Icon className="size-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-14 z-50 border-b border-white/10 bg-primary px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:bg-surface hover:text-[#F2F2F2]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-white/10 pt-2">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:bg-surface hover:text-[#F2F2F2]"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:bg-surface hover:text-[#F2F2F2]">
                    Sign in
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}
                    className="mt-1 block rounded-lg bg-accent px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-accent/90">
                    Get started free
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
