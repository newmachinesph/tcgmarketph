"use client";

import { useCurrencyStore } from "@/store/currency";

interface Props {
  usd: number | string | null | undefined;
  className?: string;
  fallback?: string;
}

/** Displays a USD price converted to the user's chosen currency. */
export function Price({ usd, className, fallback = "—" }: Props) {
  const format = useCurrencyStore((s) => s.format);
  const display = usd != null ? format(usd) : fallback;
  return <span className={className}>{display}</span>;
}
