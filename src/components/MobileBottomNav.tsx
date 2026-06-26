"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const pathname          = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Only show on narrow screens — matches Tailwind lg (1024px)
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!mounted || isDesktop) return null;

  const nav = isAuthenticated ? APP_NAV : PUBLIC_NAV;

  return createPortal(
    <div
      style={{
        position:       "fixed",
        bottom:         0,
        left:           0,
        right:          0,
        zIndex:         99999,
        display:        "flex",
        justifyContent: "center",
        alignItems:     "flex-end",
        padding:        "0 20px",
        paddingBottom:  "max(env(safe-area-inset-bottom, 0px), 12px)",
        pointerEvents:  "none",
      }}
    >
      <nav
        style={{
          display:         "flex",
          alignItems:      "center",
          gap:             "4px",
          background:      "#1C1C1E",
          borderRadius:    "9999px",
          padding:         "8px",
          boxShadow:       "0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)",
          pointerEvents:   "auto",
          marginBottom:    "8px",
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
                  boxShadow:       "0 0 20px rgba(226,75,74,0.5)",
                  flexShrink:      0,
                }}
              >
                <I style={{ width: "22px", height: "22px", color: "#ffffff" }} />
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
                  display:         "flex",
                  width:           "40px",
                  height:          "40px",
                  alignItems:      "center",
                  justifyContent:  "center",
                  borderRadius:    "9999px",
                  background:      active ? "rgba(255,255,255,0.1)" : "transparent",
                  transition:      "background 0.15s",
                }}
              >
                <I
                  style={{
                    width:  "22px",
                    height: "22px",
                    color:  active ? "#FFFFFF" : "#666666",
                    transition: "color 0.15s",
                  }}
                />
              </span>
            </Link>
          );
        })}
      </nav>
    </div>,
    document.body
  );
}
