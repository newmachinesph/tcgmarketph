"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ShoppingBagIcon,
  PlusCircleIcon,
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
import { authClient } from "@/lib/auth-client";

// ── Authenticated nav ──────────────────────────────────────────────────────────

const APP_NAV = [
  { href: "/dashboard",    label: "Home",     Icon: HomeIcon,                  ActiveIcon: HomeSolid   },
  { href: "/marketplace",  label: "Market",   Icon: ShoppingBagIcon,           ActiveIcon: ShopSolid   },
  { href: "/listings/new", label: "List",     Icon: PlusCircleIcon,            ActiveIcon: PlusCircleIcon, cta: true },
  { href: "/messages",     label: "Messages", Icon: ChatBubbleLeftRightIcon,   ActiveIcon: ChatSolid   },
  { href: "/profile",      label: "Profile",  Icon: UserCircleIcon,            ActiveIcon: UserSolid   },
];

// ── Public nav ────────────────────────────────────────────────────────────────

const PUBLIC_NAV = [
  { href: "/",            label: "Home",    Icon: HomeIcon,               ActiveIcon: HomeSolid     },
  { href: "/marketplace", label: "Market",  Icon: ShoppingBagIcon,        ActiveIcon: ShopSolid     },
  { href: "/sellers",     label: "Sellers", Icon: UserGroupIcon,          ActiveIcon: SellersSolid  },
  { href: "/browse",      label: "Browse",  Icon: MagnifyingGlassIcon,    ActiveIcon: SearchSolid   },
  { href: "/login",       label: "Sign In", Icon: UserCircleIcon,         ActiveIcon: UserSolid, cta: true },
];

function isActive(pathname: string, href: string) {
  if (href === "/" || href === "/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

interface Props {
  /** Pass true from server layouts that already verified auth, so nav renders immediately without client-side session pending flash */
  isAuthenticated?: boolean;
}

export function MobileBottomNav({ isAuthenticated }: Props) {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();

  // Use server-side hint if available, fall back to client session result
  const authed = isAuthenticated ?? !!session;
  const nav = authed ? APP_NAV : PUBLIC_NAV;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#111111] pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="flex items-stretch">
        {nav.map(({ href, label, Icon, ActiveIcon, cta }) => {
          const active = isActive(pathname, href);
          const I = active ? ActiveIcon : Icon;

          if (cta) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-accent shadow-lg shadow-accent/30">
                  <I className="size-5 text-white" />
                </span>
                <span className="text-[9px] font-semibold text-accent">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
            >
              <I className={`size-6 transition ${active ? "text-accent" : "text-[#9A9A9A]"}`} />
              <span className={`text-[9px] font-medium ${active ? "text-accent" : "text-[#9A9A9A]"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
