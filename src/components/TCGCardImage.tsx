"use client";

import { useState } from "react";

interface Props {
  src:       string;
  alt:       string;
  className?: string;
}

export function TCGCardImage({ src, alt, className }: Props) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className={`flex items-end justify-center bg-surface2 p-2 text-center text-[8px] font-semibold leading-tight text-[#9A9A9A] ${className ?? ""}`}>
        {alt}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
