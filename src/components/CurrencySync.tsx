"use client";

import { useEffect, useRef } from "react";
import { useCurrencyStore, type Currency } from "@/store/currency";

/**
 * Seeds the Zustand currency store from the user's DB preference on every
 * page load. Runs after Zustand hydrates from localStorage so the DB value
 * always wins (cross-device consistency).
 */
export function CurrencySync({ currency }: { currency: Currency }) {
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const hasHydrated = useCurrencyStore((s) => s._hasHydrated);
  const applied = useRef(false);

  useEffect(() => {
    if (hasHydrated && !applied.current) {
      applied.current = true;
      setCurrency(currency);
    }
  }, [hasHydrated, setCurrency, currency]);

  return null;
}
