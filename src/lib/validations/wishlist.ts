import { z } from "zod";

export const PRIORITIES = ["low", "medium", "high"] as const;

export const PRIORITY_LABEL: Record<(typeof PRIORITIES)[number], string> = {
  low:    "Low",
  medium: "Medium",
  high:   "High",
};

export const PRIORITY_COLOR: Record<(typeof PRIORITIES)[number], string> = {
  low:    "text-slate-400 bg-slate-400/10 ring-slate-400/20",
  medium: "text-sky-400 bg-sky-400/10 ring-sky-400/20",
  high:   "text-rose-400 bg-rose-400/10 ring-rose-400/20",
};

export const wishlistEntrySchema = z.object({
  cardId:      z.string().min(1, "Card is required"),
  priority:    z.enum(PRIORITIES).default("medium"),
  maxBuyPrice: z.coerce.number().min(0).optional(),
  notes:       z.string().max(500).optional(),
});

export type WishlistEntryInput = z.infer<typeof wishlistEntrySchema>;
