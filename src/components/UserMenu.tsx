"use client";

import { useState, useRef, useEffect } from "react";
import {
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { authClient } from "@/lib/auth-client";

interface UserMenuProps {
  name: string;
  displayName: string | null | undefined;
  email: string;
  image?: string | null;
  isAdmin?: boolean;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const letters =
    parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
  return (
    <span className="text-xs font-bold uppercase text-[#F2F2F2]">
      {letters}
    </span>
  );
}

export function UserMenu({ name, displayName, email, image, isAdmin }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/login";
  }

  const label = name;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-surface transition hover:border-white/25"
        aria-label="User menu"
        aria-expanded={open}
      >
        {image ? (
          <img src={image} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-accent/20">
            <Initials name={label} />
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-white/10 bg-surface shadow-xl shadow-black/40">
          {/* Identity */}
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-[#F2F2F2]">{label}</p>
            <p className="truncate text-xs text-[#9A9A9A]">{email}</p>
            {isAdmin && (
              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase text-accent">
                <ShieldCheckIcon className="size-3" /> Admin
              </span>
            )}
          </div>

          {/* Links */}
          <div className="p-1">
            <a
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#9A9A9A] transition hover:bg-surface2 hover:text-[#F2F2F2]"
            >
              <UserCircleIcon className="size-4 shrink-0" />
              Edit Profile
            </a>
            <a
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#9A9A9A] transition hover:bg-surface2 hover:text-[#F2F2F2]"
            >
              <Cog6ToothIcon className="size-4 shrink-0" />
              Settings
            </a>
            {isAdmin && (
              <a
                href="/admin/reports"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-accent transition hover:bg-accent/10"
              >
                <FlagIcon className="size-4 shrink-0" />
                Admin Panel
              </a>
            )}
          </div>

          <div className="border-t border-white/10 p-1">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ask transition hover:bg-ask/10"
            >
              <ArrowRightStartOnRectangleIcon className="size-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
