"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Auctions",    href: "/auction",    hot: true },
  { label: "Wanted",      href: "/wanted"      },
  { label: "Sellers",     href: "/sellers"     },
  { label: "About",       href: "/about"       },
  { label: "FAQ",         href: "/faq"         },
];

export function PublicNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-0.5 lg:flex">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        if (item.hot) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-orange-500/20 text-orange-400"
                  : "text-orange-400 hover:bg-orange-500/10"
              }`}
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-orange-400" />
              </span>
              {item.label}
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-surface text-[#F2F2F2]"
                : "text-[#9A9A9A] hover:bg-surface hover:text-[#F2F2F2]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
