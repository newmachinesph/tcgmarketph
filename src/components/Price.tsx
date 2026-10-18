"use client";

import { useCurrencyStore } from "@/store/currency";

interface Props {
  usd: number | string | null | undefined;
  className?: string;
  fallback?: string;
}

/** Displays a USD price converted to the user's chosen currency. */
export function Price({ usd, className, fallback = "—" }: Props) {
  const format      = useCurrencyStore((s) => s.format);
  const hasHydrated = useCurrencyStore((s) => s._hasHydrated);

  // Show fallback until the persisted currency preference has loaded from
  // localStorage, preventing a flash where PHP shows before the user's saved USD pref.
  const display = !hasHydrated
    ? fallback
    : usd != null
      ? format(usd)
      : fallback;

  return (
    <span className={className} suppressHydrationWarning>
      {display}
    </span>
  );
}
