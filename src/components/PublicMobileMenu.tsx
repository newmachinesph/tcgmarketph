"use client";

import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const pathname        = usePathname();

  function navClass(href: string) {
    const active = pathname === href || pathname.startsWith(href + "/");
    return `rounded-lg px-3 py-2.5 text-sm font-medium transition block ${
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
                className={item.hot
                  ? `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/10 ${pathname === item.href || pathname.startsWith(item.href + "/") ? "bg-orange-500/10" : ""}`
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

            <div className="mt-2 flex flex-col gap-1 border-t border-white/10 pt-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className={navClass("/dashboard")}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:bg-surface hover:text-[#F2F2F2]"
                  >
                    <ArrowRightStartOnRectangleIcon className="size-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:bg-surface hover:text-[#F2F2F2]">
                    Sign in
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}
                    className="block rounded-lg bg-accent px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-accent/90">
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
