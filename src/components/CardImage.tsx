"use client";

import { useState } from "react";

interface Props {
  url:       string | null;
  name:      string;
  className?: string;
}

export function CardImage({ url, name, className = "" }: Props) {
  const [errored, setErrored] = useState(false);

  if (url && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`object-cover ${className}`}
        onError={() => setErrored(true)}
      />
    );
  }

  // Placeholder — shown when url is null OR the image fails to load
  return (
    <div className={`flex flex-col items-center justify-center gap-1.5 bg-surface2 ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-8 text-white/20"
      >
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
      <span className="px-2 text-center text-[9px] font-medium leading-tight text-white/25">
        No image
      </span>
    </div>
  );
}
