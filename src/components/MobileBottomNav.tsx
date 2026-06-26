"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ShoppingBagIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  ShoppingBagIcon as ShopSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  UserCircleIcon as UserSolid,
  MagnifyingGlassIcon as SearchSolid,
  UserGroupIcon as SellersSolid,
} from "@heroicons/react/24/solid";

// ── Nav configs ────────────────────────────────────────────────────────────────

const APP_NAV = [
  { href: "/dashboard",    label: "Home",     Icon: HomeIcon,                ActiveIcon: HomeSolid  },
  { href: "/marketplace",  label: "Market",   Icon: ShoppingBagIcon,         ActiveIcon: ShopSolid  },
  { href: "/listings/new", label: "List",     Icon: PlusIcon,                ActiveIcon: PlusIcon, cta: true },
  { href: "/messages",     label: "Messages", Icon: ChatBubbleLeftRightIcon, ActiveIcon: ChatSolid  },
  { href: "/profile",      label: "Profile",  Icon: UserCircleIcon,          ActiveIcon: UserSolid  },
];

const PUBLIC_NAV = [
  { href: "/",            label: "Home",    Icon: HomeIcon,            ActiveIcon: HomeSolid    },
  { href: "/marketplace", label: "Market",  Icon: ShoppingBagIcon,     ActiveIcon: ShopSolid    },
  { href: "/sellers",     label: "Sellers", Icon: UserGroupIcon,       ActiveIcon: SellersSolid },
  { href: "/browse",      label: "Browse",  Icon: MagnifyingGlassIcon, ActiveIcon: SearchSolid  },
  { href: "/login",       label: "Sign In", Icon: UserCircleIcon,      ActiveIcon: UserSolid, cta: true },
];

function isActive(pathname: string, href: string) {
  if (href === "/" || href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  isAuthenticated?: boolean;
}

export function MobileBottomNav({ isAuthenticated = false }: Props) {
  const pathname = usePathname();
  const nav = isAuthenticated ? APP_NAV : PUBLIC_NAV;

  return (
    <nav
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-white/[0.08] bg-[#0A0A0A] lg:hidden"
    >
      <div className="flex h-[58px] items-center">
        {nav.map(({ href, label, Icon, ActiveIcon, cta }) => {
          const active = isActive(pathname, href);
          const I      = active ? ActiveIcon : Icon;

          if (cta) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center justify-center gap-1"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-accent shadow-[0_0_16px_rgba(226,75,74,0.45)]">
                  <I className="size-[22px] text-white" />
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="group flex flex-1 flex-col items-center justify-center gap-1 py-1"
            >
              <div className={`flex size-10 items-center justify-center rounded-xl transition-colors duration-150 ${
                active ? "bg-white/[0.08]" : "group-active:bg-white/5"
              }`}>
                <I className={`size-[22px] transition-colors duration-150 ${
                  active ? "text-[#F2F2F2]" : "text-[#666666]"
                }`} />
              </div>
              <span className={`text-[10px] font-medium leading-none transition-colors duration-150 ${
                active ? "text-[#F2F2F2]" : "text-[#666666]"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
