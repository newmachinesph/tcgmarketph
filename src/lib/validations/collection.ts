import { z } from "zod";

export const CONDITIONS = [
  "near_mint",
  "lightly_played",
  "moderately_played",
  "heavily_played",
  "damaged",
] as const;

export const GRADING_COMPANIES = ["psa", "bgs", "cgc"] as const;

export const CONDITION_LABEL: Record<(typeof CONDITIONS)[number], string> = {
  near_mint:         "Near Mint",
  lightly_played:    "Lightly Played",
  moderately_played: "Moderately Played",
  heavily_played:    "Heavily Played",
  damaged:           "Damaged",
};

export const CONDITION_SHORT: Record<(typeof CONDITIONS)[number], string> = {
  near_mint:         "NM",
  lightly_played:    "LP",
  moderately_played: "MP",
  heavily_played:    "HP",
  damaged:           "DMG",
};

export const CONDITION_COLOR: Record<(typeof CONDITIONS)[number], string> = {
  near_mint:         "text-emerald-400 ring-emerald-400/20 bg-emerald-400/10",
  lightly_played:    "text-lime-400    ring-lime-400/20    bg-lime-400/10",
  moderately_played: "text-yellow-400  ring-yellow-400/20  bg-yellow-400/10",
  heavily_played:    "text-orange-400  ring-orange-400/20  bg-orange-400/10",
  damaged:           "text-rose-400    ring-rose-400/20    bg-rose-400/10",
};

/**
 * Condition price multipliers relative to NM market price.
 * Industry-standard TCG condition discounts.
 */
export const CONDITION_MULTIPLIER: Record<(typeof CONDITIONS)[number], number> = {
  near_mint:         1.00,
  lightly_played:    0.80,
  moderately_played: 0.60,
  heavily_played:    0.40,
  damaged:           0.20,
};

export const collectionEntrySchema = z
  .object({
    cardId:          z.string().min(1, "Card is required"),
    quantity:        z.coerce.number().int().min(1, "At least 1").max(999),
    isGraded:        z.boolean().default(false),
    condition:       z.enum(CONDITIONS).default("near_mint"),
    gradingCompany:  z.enum(["none", ...GRADING_COMPANIES]).default("none"),
    gradeValue:      z.coerce.number().min(0).max(10).optional(),
    isFoil:          z.boolean().default(false),
    isFirstEdition:  z.boolean().default(false),
    language:        z.string().default("en"),
    purchasePrice:   z.coerce.number().min(0).optional(),
    notes:           z.string().max(500).optional(),
    isFavorite:      z.boolean().default(false),
  })
  .refine(
    (d) => !(d.isGraded && d.gradingCompany === "none"),
    { message: "Select a grading company", path: ["gradingCompany"] }
  )
  .refine(
    (d) => !(d.isGraded && (d.gradeValue == null || isNaN(d.gradeValue))),
    { message: "Enter a grade value (0–10)", path: ["gradeValue"] }
  );

export type CollectionEntryInput = z.infer<typeof collectionEntrySchema>;
