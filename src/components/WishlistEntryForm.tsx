"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  wishlistEntrySchema,
  PRIORITIES,
  PRIORITY_LABEL,
  PRIORITY_COLOR,
  type WishlistEntryInput,
} from "@/lib/validations/wishlist";
import { GAME_LABEL } from "@/lib/constants/games";
import type { CardCatalog } from "@/db/schema/cards";
import { CardImage } from "@/components/CardImage";
import { Price } from "@/components/Price";

interface Props {
  card: CardCatalog;
  defaultValues?: Partial<WishlistEntryInput>;
  onSubmit: (data: WishlistEntryInput) => Promise<void>;
  submitLabel?: string;
  onBack?: () => void;
}

export function WishlistEntryForm({
  card,
  defaultValues,
  onSubmit,
  submitLabel = "Add to Wishlist",
  onBack,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WishlistEntryInput>({
    resolver: zodResolver(wishlistEntrySchema) as Resolver<WishlistEntryInput>,
    defaultValues: { cardId: card.id, priority: "medium", ...defaultValues },
  });

  const priority = watch("priority");

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
            <p className="text-[10px] text-[#9A9A9A]">Market: <Price usd={card.marketPrice} /></p>
          )}
        </div>
      </div>

      {/* Priority */}
      <div>
        <p className="mb-1.5 text-xs text-[#9A9A9A]">Priority</p>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p} type="button"
              onClick={() => setValue("priority", p)}
              className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${
                priority === p ? `${PRIORITY_COLOR[p]} ring-1` : "border-white/10 text-[#9A9A9A] hover:border-white/20"
              }`}
            >
              {PRIORITY_LABEL[p]}
            </button>
          ))}
        </div>
        {errors.priority && <p className="mt-1 text-xs text-rose-400">{errors.priority.message}</p>}
      </div>

      {/* Max buy price */}
      <div className="flex items-center gap-3">
        <label className="w-28 shrink-0 text-xs text-[#9A9A9A]">Max Price (PHP)</label>
        <input
          {...register("maxBuyPrice")}
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
          placeholder="e.g. looking for LP or better"
          className="w-full resize-none rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
        />
        {errors.notes && <p className="mt-1 text-xs text-rose-400">{errors.notes.message}</p>}
      </div>

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
          className="flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
