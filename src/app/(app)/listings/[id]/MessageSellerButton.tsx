"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";

export function MessageSellerButton({
  sellerId,
  listingId,
}: {
  sellerId: string;
  listingId: string;
}) {
  const router            = useRouter();
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    const res  = await fetch("/api/conversations", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ recipientId: sellerId, listingId }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/messages/${data.conversation.id}`);
    setLoading(false);
  }

  return (
    <button
      onClick={open}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2] disabled:opacity-50"
    >
      <ChatBubbleLeftEllipsisIcon className="size-4" />
      {loading ? "Opening…" : "Message Seller"}
    </button>
  );
}
