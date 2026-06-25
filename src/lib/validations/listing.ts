import { z } from "zod";

export const CONDITIONS = ["near_mint", "lightly_played", "moderately_played", "heavily_played", "damaged"] as const;
export const GRADING_COMPANIES = ["none", "psa", "bgs", "cgc"] as const;

export const CONDITION_LABEL: Record<string, string> = {
  near_mint:         "Near Mint",
  lightly_played:    "Lightly Played",
  moderately_played: "Moderately Played",
  heavily_played:    "Heavily Played",
  damaged:           "Damaged",
};

export const createListingSchema = z.object({
  cardId:      z.string().min(1, "Card is required"),
  condition:   z.enum(CONDITIONS).default("near_mint"),
  isGraded:    z.boolean().default(false),
  gradingCompany: z.enum(GRADING_COMPANIES).default("none"),
  gradeValue:  z.coerce.number().min(1).max(10).optional(),
  isFoil:      z.boolean().default(false),
  isFirstEdition: z.boolean().default(false),
  price:       z.coerce.number().positive("Price must be greater than 0"),
  quantity:    z.coerce.number().int().min(1).max(99).default(1),
  description: z.string().max(1000).optional(),
  photoUrls:   z.array(z.string().url()).default([]),
  // Set by the "list from collection" flow — not required
  sourceCollectionId: z.string().optional(),
});

export const editListingSchema = z.object({
  price:       z.coerce.number().positive().optional(),
  quantity:    z.coerce.number().int().min(1).max(99).optional(),
  description: z.string().max(1000).optional(),
  status:      z.enum(["active", "paused"]).optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type EditListingInput   = z.infer<typeof editListingSchema>;
