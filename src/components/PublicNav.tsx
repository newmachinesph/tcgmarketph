"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Sellers",     href: "/sellers"     },
  { label: "About",       href: "/about"       },
  { label: "Safety",      href: "/safety"      },
  { label: "FAQ",         href: "/faq"         },
];

export function PublicNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-0.5 lg:flex">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
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
