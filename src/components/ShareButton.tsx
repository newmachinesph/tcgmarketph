"use client";

import { useState } from "react";
import { ShareIcon, CheckIcon } from "@heroicons/react/24/outline";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button
      onClick={handleShare}
      title="Share this listing"
      className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
    >
      {copied ? (
        <>
          <CheckIcon className="size-3.5 text-bid" />
          <span className="text-bid">Copied!</span>
        </>
      ) : (
        <>
          <ShareIcon className="size-3.5" />
          Share
        </>
      )}
    </button>
  );
}
