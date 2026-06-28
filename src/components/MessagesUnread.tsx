"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";

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

  if (mobile) {
    return (
      <Link
        href="/messages"
        onClick={onClick}
        className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
          isActive ? "bg-surface text-[#F2F2F2]" : "text-[#9A9A9A] hover:bg-surface hover:text-[#F2F2F2]"
        }`}
      >
        <ChatBubbleOvalLeftEllipsisIcon className="size-4 shrink-0" />
        Messages
        {unread > 0 && (
          <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/messages"
      onClick={onClick}
      aria-label={`Messages${unread > 0 ? ` (${unread} unread)` : ""}`}
      className={`relative flex size-9 items-center justify-center rounded-lg border border-white/10 transition ${
        isActive
          ? "border-white/20 bg-surface text-[#F2F2F2]"
          : "text-[#9A9A9A] hover:border-white/20 hover:bg-surface hover:text-[#F2F2F2]"
      }`}
    >
      <ChatBubbleOvalLeftEllipsisIcon className="size-5" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
