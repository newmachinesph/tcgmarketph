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
      <style>{`@media(min-width:1024px){#mbn{display:none!important}}`}</style>

      <div
        id="mbn"
        style={{
          position:      "fixed",
          bottom:        0,
          left:          0,
          right:         0,
          zIndex:        40,
          background:    "#161616",
          borderTop:     "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <nav style={{ display: "flex", alignItems: "stretch" }}>
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
                    flex:           1,
                    display:        "flex",
                    flexDirection:  "column",
                    alignItems:     "center",
                    justifyContent: "center",
                    gap:            "3px",
                    paddingTop:     "10px",
                    paddingBottom:  "10px",
                  }}
                >
                  <span
                    style={{
                      display:        "flex",
                      width:          "36px",
                      height:         "36px",
                      alignItems:     "center",
                      justifyContent: "center",
                      borderRadius:   "9999px",
                      background:     "#E24B4A",
                      boxShadow:      "0 0 12px rgba(226,75,74,0.35)",
                    }}
                  >
                    <I style={{ width: "18px", height: "18px", color: "#fff" }} />
                  </span>
                  <span style={{ fontSize: "10px", color: "#E24B4A", fontWeight: 600, lineHeight: 1 }}>
                    {label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                style={{
                  flex:           1,
                  display:        "flex",
                  flexDirection:  "column",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            "3px",
                  paddingTop:     "10px",
                  paddingBottom:  "10px",
                }}
              >
                <I
                  style={{
                    width:  "22px",
                    height: "22px",
                    color:  active ? "#E24B4A" : "#6B6B6B",
                  }}
                />
                <span
                  style={{
                    fontSize:   "10px",
                    fontWeight: active ? 600 : 400,
                    color:      active ? "#E24B4A" : "#6B6B6B",
                    lineHeight: 1,
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
