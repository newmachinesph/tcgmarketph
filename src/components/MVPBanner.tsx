"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const STORAGE_KEY = "tcgmarket_mvp_dismissed";

export function MVPBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl shadow-black/60">
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-lg p-1 text-[#9A9A9A] transition hover:bg-white/10 hover:text-[#F2F2F2]"
          aria-label="Close"
        >
          <XMarkIcon className="size-5" />
        </button>

        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-yellow-400">
          🚧 MVP Preview
        </span>

        <h2 className="mt-4 text-xl font-bold text-[#F2F2F2]">
          This is a work in progress
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-[#9A9A9A]">
          TCGMarket PH is currently an early-stage MVP. All listings, users, bids,
          and transactions on this platform are <span className="font-semibold text-[#F2F2F2]">sample data</span> — nothing here is real.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-[#9A9A9A]">
          The technical foundation is built. What&apos;s missing is a{" "}
          <span className="font-semibold text-[#F2F2F2]">business co-founder</span> — someone
          who understands the Philippine TCG community, can talk to sellers and buyers,
          and wants to grow this into something real.
        </p>

        <a
          href="https://www.reddit.com/r/PhStartups/comments/1ugy6e5/technical_founder_looking_for_a_business/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/80"
        >
          Read the co-founder post
          <ArrowTopRightOnSquareIcon className="size-4" />
        </a>

        <button
          onClick={dismiss}
          className="mt-2 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-[#9A9A9A] transition hover:border-white/20 hover:text-[#F2F2F2]"
        >
          Got it, let me explore
        </button>
      </div>
    </div>
  );
}
