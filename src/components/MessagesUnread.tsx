"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function MessagesNavItem({
  mobile = false,
  onClick,
}: {
  mobile?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const isActive = pathname.startsWith("/messages");

  useEffect(() => {
    let cancelled = false;
    async function fetchUnread() {
      try {
        const res  = await fetch("/api/conversations");
        const data = await res.json();
        if (!cancelled) setUnread(data.unreadTotal ?? 0);
      } catch { /* ignore */ }
    }
    fetchUnread();
    const t = setInterval(fetchUnread, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return (
    <Link
      href="/messages"
      onClick={onClick}
      className={`relative rounded-lg px-3 text-sm font-medium transition ${mobile ? "py-2.5" : "py-1.5"} ${
        isActive
          ? "bg-surface text-[#F2F2F2]"
          : "text-[#9A9A9A] hover:bg-surface hover:text-[#F2F2F2]"
      }`}
    >
      Messages
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
