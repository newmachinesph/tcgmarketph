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
  { href: "/dashboard",    label: "Home",     Icon: HomeIcon,                ActiveIcon: HomeSolid },
  { href: "/marketplace",  label: "Market",   Icon: ShoppingBagIcon,         ActiveIcon: ShopSolid },
  { href: "/listings/new", label: "List",     Icon: PlusIcon,                ActiveIcon: PlusIcon,  cta: true },
  { href: "/messages",     label: "Messages", Icon: ChatBubbleLeftRightIcon, ActiveIcon: ChatSolid },
  { href: "/profile",      label: "Profile",  Icon: UserCircleIcon,          ActiveIcon: UserSolid },
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
  const nav      = isAuthenticated ? APP_NAV : PUBLIC_NAV;

  return (
    <>
      {/* Hide on desktop — inline style beats any Tailwind conflict */}
      <style>{`@media(min-width:1024px){#mbn{display:none!important}}`}</style>

      <div
        id="mbn"
        style={{
          position:       "fixed",
          bottom:         0,
          left:           0,
          right:          0,
          zIndex:         99999,
          display:        "flex",
          justifyContent: "center",
          paddingLeft:    "20px",
          paddingRight:   "20px",
          paddingBottom:  "max(env(safe-area-inset-bottom, 0px), 16px)",
        }}
      >
        <nav
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "2px",
            background:   "#252525",
            borderRadius: "9999px",
            padding:      "6px",
            border:       "1px solid rgba(255,255,255,0.10)",
            boxShadow:    "0 4px 24px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4)",
          }}
        >
          {nav.map(({ href, label, Icon, ActiveIcon, cta }) => {
            const active = isActive(pathname, href);
            const I      = active ? ActiveIcon : Icon;

            if (cta) {
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  style={{
                    display:         "flex",
                    width:           "48px",
                    height:          "48px",
                    alignItems:      "center",
                    justifyContent:  "center",
                    borderRadius:    "9999px",
                    background:      "#E24B4A",
                    flexShrink:      0,
                    boxShadow:       "0 0 16px rgba(226,75,74,0.45)",
                  }}
                >
                  <I style={{ width: "20px", height: "20px", color: "#fff" }} />
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                style={{
                  display:        "flex",
                  width:          "48px",
                  height:         "48px",
                  alignItems:     "center",
                  justifyContent: "center",
                  borderRadius:   "9999px",
                  flexShrink:     0,
                }}
              >
                <span
                  style={{
                    display:        "flex",
                    width:          "40px",
                    height:         "40px",
                    alignItems:     "center",
                    justifyContent: "center",
                    borderRadius:   "9999px",
                    background:     active ? "rgba(255,255,255,0.12)" : "transparent",
                  }}
                >
                  <I
                    style={{
                      width:  "22px",
                      height: "22px",
                      color:  active ? "#FFFFFF" : "#777777",
                    }}
                  />
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
