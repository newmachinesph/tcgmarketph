"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bars3Icon, XMarkIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";

const NAV = [
  { label: "Marketplace", href: "/marketplace", hot: false },
  { label: "Auctions",    href: "/auction",     hot: true  },
  { label: "Sellers",     href: "/sellers",     hot: false },
  { label: "About",       href: "/about",       hot: false },
  { label: "FAQ",         href: "/faq",         hot: false },
];

export function PublicMobileMenu({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname              = usePathname();

  // Only portal after hydration — avoids SSR mismatch
  useEffect(() => setMounted(true), []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function navClass(href: string) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return `flex items-center rounded-lg px-4 py-3 text-sm font-medium transition ${
      active
        ? "bg-surface text-[#F2F2F2]"
        : "text-[#9A9A9A] hover:bg-surface hover:text-[#F2F2F2]"
    }`;
  }

  async function handleSignOut() {
    setOpen(false);
    await authClient.signOut();
    window.location.href = "/login";
  }

  // Portaled so that `fixed` positioning is always relative to the viewport,
  // not clipped by the header's -webkit-backdrop-filter containing block (Safari bug).
  const overlay = (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#111111] shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="text-xl font-extrabold tracking-tight text-accent"
          >
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
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={item.hot
                ? `flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/10 ${
                    pathname === item.href || pathname.startsWith(item.href + "/") ? "bg-orange-500/10" : ""
                  }`
                : navClass(item.href)}
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
        </nav>

        {/* Bottom actions */}
        <div className="shrink-0 border-t border-white/10 p-3">
          {isLoggedIn ? (
            <div className="flex flex-col gap-0.5">
              <Link href="/dashboard" onClick={() => setOpen(false)} className={navClass("/dashboard")}>
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-[#9A9A9A] transition hover:bg-surface hover:text-[#F2F2F2]"
              >
                <ArrowRightStartOnRectangleIcon className="size-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-lg border border-white/10 px-4 py-2.5 text-center text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="block rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                Get started free
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Hamburger — stays inside the header in the DOM */}
      <button
        onClick={() => setOpen(true)}
        className="flex size-9 items-center justify-center rounded-lg border border-white/10 text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] lg:hidden"
        aria-label="Open menu"
      >
        <Bars3Icon className="size-5" />
      </button>

      {/* Backdrop + drawer portaled to body so fixed positioning escapes
          the header's -webkit-backdrop-filter containing block */}
      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
