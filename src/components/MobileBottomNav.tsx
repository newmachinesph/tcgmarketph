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

const APP_NAV = [
  { href: "/dashboard",    label: "Home",     Icon: HomeIcon,                ActiveIcon: HomeSolid  },
  { href: "/marketplace",  label: "Market",   Icon: ShoppingBagIcon,         ActiveIcon: ShopSolid  },
  { href: "/listings/new", label: "List",     Icon: PlusIcon,                ActiveIcon: PlusIcon,   cta: true },
  { href: "/messages",     label: "Messages", Icon: ChatBubbleLeftRightIcon, ActiveIcon: ChatSolid  },
  { href: "/profile",      label: "Profile",  Icon: UserCircleIcon,          ActiveIcon: UserSolid  },
];

const PUBLIC_NAV = [
  { href: "/",            label: "Home",    Icon: HomeIcon,            ActiveIcon: HomeSolid    },
  { href: "/marketplace", label: "Market",  Icon: ShoppingBagIcon,     ActiveIcon: ShopSolid    },
  { href: "/sellers",     label: "Sellers", Icon: UserGroupIcon,       ActiveIcon: SellersSolid },
  { href: "/browse",      label: "Browse",  Icon: MagnifyingGlassIcon, ActiveIcon: SearchSolid  },
  { href: "/login",       label: "Sign In", Icon: UserCircleIcon,      ActiveIcon: UserSolid,   cta: true },
];

function isActive(pathname: string, href: string) {
  if (href === "/" || href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

interface Props {
  isAuthenticated?: boolean;
}

export function MobileBottomNav({ isAuthenticated = false }: Props) {
  const pathname = usePathname();
  const nav = isAuthenticated ? APP_NAV : PUBLIC_NAV;

  return (
    <div
      style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
      className="fixed inset-x-0 bottom-0 z-[9999] flex justify-center pb-3 lg:hidden"
    >
      {/* Floating pill */}
      <nav className="flex items-center gap-1 rounded-full bg-[#1C1C1E] px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {nav.map(({ href, label, Icon, ActiveIcon, cta }) => {
          const active = isActive(pathname, href);
          const I      = active ? ActiveIcon : Icon;

          if (cta) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="flex size-12 items-center justify-center rounded-full bg-accent shadow-[0_0_16px_rgba(226,75,74,0.5)] transition-transform active:scale-95"
              >
                <I className="size-5 text-white" />
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex size-12 items-center justify-center rounded-full transition-transform active:scale-95"
            >
              {/* Active ring */}
              <span className={`flex size-10 items-center justify-center rounded-full transition-colors duration-200 ${
                active ? "bg-white/10" : ""
              }`}>
                <I className={`size-[22px] transition-colors duration-200 ${
                  active ? "text-white" : "text-[#555555]"
                }`} />
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
