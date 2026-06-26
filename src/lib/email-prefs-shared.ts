// Client-safe constants — no server/DB imports

export type PrefCategory = "offers" | "messages" | "wishlist" | "transactions";

export type EmailPrefs = Record<PrefCategory, boolean>;

export const DEFAULT_PREFS: EmailPrefs = {
  offers:       true,
  messages:     true,
  wishlist:     true,
  transactions: true,
};

export const PREF_LABELS: Record<PrefCategory, { label: string; description: string }> = {
  offers:       { label: "Offer alerts",           description: "When someone makes, counters, or accepts an offer on your listing." },
  messages:     { label: "Message notifications",  description: "When you receive a new direct message." },
  wishlist:     { label: "Wishlist alerts",         description: "When a card on your wishlist becomes available." },
  transactions: { label: "Transaction updates",     description: "Purchase confirmations, meetup proposals, and cancellations." },
};
