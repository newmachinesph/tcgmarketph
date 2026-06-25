import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "USD" | "PHP";

// Hardcoded rate — Phase 5 price refresh job can update this in future
export const PHP_RATE = 61.31;

interface CurrencyStore {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggle: () => void;
  /** Convert a USD amount to the current display currency */
  convert: (usd: number) => number;
  /** Format a USD amount as a display string in the current currency */
  format: (usd: number | string | null | undefined) => string;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: "PHP",

      setCurrency: (c) => set({ currency: c }),
      toggle: () => set((s) => ({ currency: s.currency === "USD" ? "PHP" : "USD" })),

      convert: (usd) => {
        const { currency } = get();
        return currency === "PHP" ? usd * PHP_RATE : usd;
      },

      format: (raw) => {
        if (raw == null) return "—";
        const usd = typeof raw === "string" ? parseFloat(raw) : raw;
        if (isNaN(usd)) return "—";
        const { currency } = get();
        if (currency === "PHP") {
          return `₱${(usd * PHP_RATE).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `$${usd.toFixed(2)}`;
      },
    }),
    { name: "tcg-currency" }
  )
);
