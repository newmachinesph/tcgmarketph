"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Squares2X2Icon,
  FlagIcon,
  UsersIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const NAV = [
  { label: "Dashboard", href: "/admin",           icon: Squares2X2Icon         },
  { label: "Reports",   href: "/admin/reports",    icon: FlagIcon               },
  { label: "Disputes",  href: "/admin/disputes",   icon: ExclamationTriangleIcon },
  { label: "Users",     href: "/admin/users",      icon: UsersIcon              },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-6 py-8 lg:px-10">
      {/* Sub-nav */}
      <div className="mb-8 flex items-center gap-1 border-b border-white/10 pb-0">
        <span className="mr-4 text-xs font-semibold uppercase tracking-widest text-accent">Admin</span>
        {NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition -mb-px ${
              isActive(href)
                ? "border-accent text-[#F2F2F2]"
                : "border-transparent text-[#9A9A9A] hover:text-[#F2F2F2]"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}
