"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  collectionEntrySchema,
  CONDITIONS,
  CONDITION_LABEL,
  CONDITION_SHORT,
  CONDITION_COLOR,
  type CollectionEntryInput,
} from "@/lib/validations/collection";
import { GAME_LABEL } from "@/lib/constants/games";
import type { CardCatalog } from "@/db/schema/cards";
import { CardImage } from "@/components/CardImage";
import { Price } from "@/components/Price";

interface Props {
  card: CardCatalog;
  defaultValues?: Partial<CollectionEntryInput>;
  onSubmit: (data: CollectionEntryInput) => Promise<void>;
  submitLabel?: string;
  onBack?: () => void;
}

export function CollectionEntryForm({
  card,
  defaultValues,
  onSubmit,
  submitLabel = "Add to Collection",
  onBack,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CollectionEntryInput>({
    resolver: zodResolver(collectionEntrySchema) as Resolver<CollectionEntryInput>,
    defaultValues: {
      cardId:         card.id,
      quantity:       1,
      isGraded:       false,
      condition:      "near_mint",
      gradingCompany: "none",
      isFoil:         false,
      isFirstEdition: false,
      language:       "en",
      isFavorite:     false,
      ...defaultValues,
    },
  });

  const isGraded = watch("isGraded");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Card preview */}
      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-surface2 p-3">
        <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
          <CardImage url={card.imageUrl} name={card.name} className="h-full w-full" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#F2F2F2]">{card.name}</p>
          <p className="truncate text-xs text-[#9A9A9A]">
            {card.setName ?? GAME_LABEL[card.game]}
            {card.cardNumber ? ` · ${card.cardNumber}` : ""}
          </p>
          {card.marketPrice && (
            <p className="text-[10px] text-[#9A9A9A]">
              Market: <Price usd={card.marketPrice} />
            </p>
          )}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-3">
        <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Quantity</label>
        <input
          {...register("quantity")}
          type="number" min={1} max={999}
          className="w-24 rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none"
        />
        {errors.quantity && <p className="text-xs text-rose-400">{errors.quantity.message}</p>}
      </div>

      {/* Raw / Graded toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setValue("isGraded", false); setValue("gradingCompany", "none"); }}
          className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${!isGraded ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}
        >
          Raw
        </button>
        <button
          type="button"
          onClick={() => setValue("isGraded", true)}
          className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${isGraded ? "border-purple-400 bg-purple-400/10 text-purple-400" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}
        >
          Graded
        </button>
      </div>

      {/* Condition (raw only) */}
      {!isGraded && (
        <div>
          <p className="mb-1.5 text-xs text-[#9A9A9A]">Condition</p>
          <div className="grid grid-cols-5 gap-1.5">
            {CONDITIONS.map((c) => (
              <button
                key={c} type="button"
                onClick={() => setValue("condition", c)}
                title={CONDITION_LABEL[c]}
                aria-label={CONDITION_LABEL[c]}
                className={`rounded-lg border py-2 text-[10px] font-bold uppercase transition ${
                  watch("condition") === c
                    ? `${CONDITION_COLOR[c]} ring-1`
                    : "border-white/10 text-[#9A9A9A] hover:border-white/20"
                }`}
              >
                {CONDITION_SHORT[c]}
              </button>
            ))}
          </div>
          <p className="mt-1 text-right text-[10px] text-[#9A9A9A]">
            {CONDITION_LABEL[watch("condition")]}
          </p>
        </div>
      )}

      {/* Grading fields */}
      {isGraded && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Company</label>
            <div className="flex gap-2">
              {(["psa", "bgs", "cgc"] as const).map((co) => (
                <button
                  key={co} type="button"
                  onClick={() => setValue("gradingCompany", co)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase transition ${
                    watch("gradingCompany") === co
                      ? "border-purple-400 bg-purple-400/10 text-purple-400"
                      : "border-white/10 text-[#9A9A9A] hover:border-white/20"
                  }`}
                >
                  {co.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Grade</label>
            <input
              {...register("gradeValue")}
              type="number" min={1} max={10} step={0.5} placeholder="e.g. 9.5"
              className="w-24 rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none"
            />
            {errors.gradeValue && <p className="text-xs text-rose-400">{errors.gradeValue.message}</p>}
          </div>
        </div>
      )}

      {/* Foil + 1st Ed */}
      <div className="flex gap-4">
        {([["isFoil", "Foil"], ["isFirstEdition", "1st Edition"]] as const).map(([field, label]) => (
          <label key={field} className="flex cursor-pointer items-center gap-2 text-xs text-[#9A9A9A]">
            <input
              {...register(field)}
              type="checkbox"
              className="size-4 rounded border-white/20 bg-surface2 accent-accent"
            />
            {label}
          </label>
        ))}
      </div>

      {/* Purchase price */}
      <div className="flex items-center gap-3">
        <label className="w-24 shrink-0 text-xs text-[#9A9A9A]">Paid (PHP)</label>
        <input
          {...register("purchasePrice")}
          type="number" min={0} step={0.01} placeholder="optional"
          className="w-36 rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1 block text-xs text-[#9A9A9A]">Notes (optional)</label>
        <textarea
          {...register("notes")}
          rows={2}
          placeholder="e.g. bought at GP Manila 2024"
          className="w-full resize-none rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {onBack && (
          <button
            type="button" onClick={onBack}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-[#9A9A9A] hover:text-[#F2F2F2] transition"
          >
            ← Back
          </button>
        )}
        <button
          type="submit" disabled={isSubmitting}
          className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
