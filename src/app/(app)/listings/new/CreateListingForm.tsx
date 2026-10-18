"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  createListingSchema,
  type CreateListingInput,
  CONDITIONS,
  CONDITION_LABEL,
  GRADING_COMPANIES,
} from "@/lib/validations/listing";
import { useUploadThing } from "@/lib/uploadthing";
import type { CardCatalog } from "@/db/schema/cards";
import Image from "next/image";

// ── Condition colour map ──────────────────────────────────────────────────────

const CONDITION_COLOR: Record<string, string> = {
  near_mint:         "border-emerald-400 bg-emerald-400/10 text-emerald-400",
  lightly_played:    "border-lime-400    bg-lime-400/10    text-lime-400",
  moderately_played: "border-yellow-400  bg-yellow-400/10  text-yellow-400",
  heavily_played:    "border-orange-400  bg-orange-400/10  text-orange-400",
  damaged:           "border-rose-400    bg-rose-400/10    text-rose-400",
};

const CONDITION_SHORT: Record<string, string> = {
  near_mint: "NM", lightly_played: "LP", moderately_played: "MP",
  heavily_played: "HP", damaged: "DMG",
};

// ── Card picker ───────────────────────────────────────────────────────────────

type PickedCard = Pick<CardCatalog, "id" | "name" | "setName" | "imageUrl" | "game">;

function CardPicker({ value, onChange }: { value: PickedCard | null; onChange: (c: PickedCard | null) => void }) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<PickedCard[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/cards/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.cards ?? []);
    } finally {
      setSearching(false);
    }
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-surface2 p-3">
        {value.imageUrl && (
          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md">
            <Image src={value.imageUrl} alt={value.name} fill sizes="40px" className="object-cover" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#F2F2F2]">{value.name}</p>
          <p className="text-xs text-[#9A9A9A]">{value.setName}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} aria-label="Clear card selection"
          className="text-[#9A9A9A] hover:text-[#F2F2F2] transition">
          <XMarkIcon className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9A9A]" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
          placeholder="Search card name…"
          className="w-full rounded-xl border border-white/10 bg-surface2 py-2.5 pl-9 pr-4 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none"
        />
      </div>
      {searching && <p className="text-xs text-[#9A9A9A]">Searching…</p>}
      {results.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-surface2 divide-y divide-white/5 max-h-60 overflow-y-auto">
          {results.map((card) => (
            <button key={card.id} type="button"
              onClick={() => { onChange(card); setQuery(""); setResults([]); }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5">
              {card.imageUrl && (
                <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded">
                  <Image src={card.imageUrl} alt={card.name} fill sizes="28px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#F2F2F2]">{card.name}</p>
                <p className="truncate text-xs text-[#9A9A9A]">{card.setName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Photo uploader ────────────────────────────────────────────────────────────

function PhotoUploader({ urls, onChange, max }: { urls: string[]; onChange: (urls: string[]) => void; max: number }) {
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("listingPhoto");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = max - urls.length;
    const toUpload = files.slice(0, remaining);

    if (files.length > remaining) {
      toast.error(`Max ${max} photos. Only uploading ${remaining} more.`);
    }

    setUploading(true);
    try {
      const uploaded = await startUpload(toUpload);
      if (uploaded) {
        onChange([...urls, ...uploaded.map((f) => f.url)]);
      }
    } catch {
      toast.error("Upload failed — try again");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <div key={url} className="group relative h-20 w-16 overflow-hidden rounded-lg border border-white/10">
            <Image src={url} alt={`Photo ${i + 1}`} fill sizes="64px" className="object-cover" />
            <button type="button"
              onClick={() => onChange(urls.filter((_, j) => j !== i))}
              aria-label="Remove photo"
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
              <TrashIcon className="size-4 text-rose-400" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[9px] font-bold text-white">Cover</span>
            )}
          </div>
        ))}

        {urls.length < max && (
          <label className={`flex h-20 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 transition hover:border-accent/50 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
            <PhotoIcon className="size-5 text-[#9A9A9A]" />
            <span className="mt-0.5 text-[9px] text-[#9A9A9A]">{uploading ? "Uploading…" : "Add"}</span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={handleFiles} disabled={uploading} />
          </label>
        )}
      </div>
      <p className="text-[10px] text-[#9A9A9A]">
        First photo is the cover · max {max} photos · 8 MB each
      </p>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface Prefill {
  cardId: string; cardName: string; cardSet: string | null; cardImage: string | null;
  condition: string; isGraded: boolean; gradingCompany: string; gradeValue: string | null;
  isFoil: boolean; isFirstEdition: boolean; sourceCollectionId: string;
}

interface Props { prefill: Prefill | null; maxPhotos: number; }

export function CreateListingForm({ prefill, maxPhotos }: Props) {
  const router = useRouter();

  const prefillCard: PickedCard | null = prefill
    ? { id: prefill.cardId, name: prefill.cardName, setName: prefill.cardSet, imageUrl: prefill.cardImage, game: "pokemon" }
    : null;

  const [selectedCard, setSelectedCard] = useState<PickedCard | null>(prefillCard);
  const [photoUrls, setPhotoUrls]       = useState<string[]>([]);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema) as Resolver<CreateListingInput>,
    defaultValues: {
      cardId:             prefill?.cardId ?? "",
      type:               "fixed_price",
      condition:          (prefill?.condition as CreateListingInput["condition"]) ?? "near_mint",
      isGraded:           prefill?.isGraded ?? false,
      gradingCompany:     (prefill?.gradingCompany as CreateListingInput["gradingCompany"]) ?? "none",
      gradeValue:         prefill?.gradeValue ? parseFloat(prefill.gradeValue) : undefined,
      isFoil:             prefill?.isFoil ?? false,
      isFirstEdition:     prefill?.isFirstEdition ?? false,
      quantity:           1,
      bidIncrement:       50,
      photoUrls:          [],
      sourceCollectionId: prefill?.sourceCollectionId,
    },
  });

  const isGraded  = watch("isGraded");
  const condition = watch("condition");
  const listingType = watch("type");

  function handleCardSelect(card: PickedCard | null) {
    setSelectedCard(card);
    setValue("cardId", card?.id ?? "");
  }

  async function onSubmit(data: CreateListingInput) {
    if (!selectedCard) { toast.error("Select a card first"); return; }

    // datetime-local gives local time without timezone — convert to ISO
    const payload = {
      ...data,
      photoUrls,
      auctionEnd: data.auctionEnd ? new Date(data.auctionEnd).toISOString() : undefined,
    };

    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Failed to create listing");
      return;
    }

    const { listing } = await res.json();
    toast.success("Listing created!");
    router.push(`/listings/${listing.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

      {/* Listing type */}
      <div>
        <label className="mb-2 block text-xs font-medium text-[#9A9A9A]">Listing type</label>
        <div className="flex gap-2">
          {([["fixed_price", "Fixed Price"], ["auction", "Auction"]] as const).map(([val, label]) => (
            <button key={val} type="button"
              onClick={() => setValue("type", val)}
              className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${listingType === val ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Card selection */}
      <div>
        <label className="mb-2 block text-xs font-medium text-[#9A9A9A]">Card *</label>
        <CardPicker value={selectedCard} onChange={handleCardSelect} />
        {errors.cardId && <p className="mt-1 text-xs text-rose-400">{errors.cardId.message}</p>}
      </div>

      {/* Raw / Graded */}
      <div className="flex gap-2">
        <button type="button"
          onClick={() => { setValue("isGraded", false); setValue("gradingCompany", "none"); }}
          className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${!isGraded ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
          Raw
        </button>
        <button type="button"
          onClick={() => setValue("isGraded", true)}
          className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${isGraded ? "border-purple-400 bg-purple-400/10 text-purple-400" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
          Graded
        </button>
      </div>

      {/* Condition (raw only) */}
      {!isGraded && (
        <div>
          <label className="mb-2 block text-xs font-medium text-[#9A9A9A]">Condition</label>
          <div className="grid grid-cols-5 gap-1.5">
            {CONDITIONS.map((c) => (
              <button key={c} type="button"
                onClick={() => setValue("condition", c)}
                title={CONDITION_LABEL[c]}
                aria-label={CONDITION_LABEL[c]}
                className={`rounded-lg border py-2 text-[10px] font-bold uppercase transition ${condition === c ? `${CONDITION_COLOR[c]} ring-1` : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
                {CONDITION_SHORT[c]}
              </button>
            ))}
          </div>
          <p className="mt-1 text-right text-[10px] text-[#9A9A9A]">{CONDITION_LABEL[condition]}</p>
        </div>
      )}

      {/* Grading (graded only) */}
      {isGraded && (
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-xs font-medium text-[#9A9A9A]">Grading Company</label>
            <div className="flex gap-2">
              {(["psa", "bgs", "cgc"] as const).map((co) => (
                <button key={co} type="button"
                  onClick={() => setValue("gradingCompany", co)}
                  className={`rounded-lg border px-4 py-2 text-xs font-bold uppercase transition ${watch("gradingCompany") === co ? "border-purple-400 bg-purple-400/10 text-purple-400" : "border-white/10 text-[#9A9A9A] hover:border-white/20"}`}>
                  {co.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Grade</label>
            <input {...register("gradeValue")} type="number" min={1} max={10} step={0.5} placeholder="e.g. 9.5"
              className="w-28 rounded-lg border border-white/10 bg-surface2 px-3 py-2 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none" />
            {errors.gradeValue && <p className="mt-1 text-xs text-rose-400">{errors.gradeValue.message}</p>}
          </div>
        </div>
      )}

      {/* Foil + 1st Ed */}
      <div className="flex gap-6">
        {([["isFoil", "Foil"], ["isFirstEdition", "1st Edition"]] as const).map(([field, label]) => (
          <label key={field} className="flex cursor-pointer items-center gap-2 text-sm text-[#9A9A9A]">
            <input {...register(field)} type="checkbox" className="size-4 rounded border-white/20 bg-surface2 accent-accent" />
            {label}
          </label>
        ))}
      </div>

      {/* Fixed price fields */}
      {listingType !== "auction" && (
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Price (PHP) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9A9A9A]">₱</span>
              <input {...register("price")} type="number" min={1} step={0.01} placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-surface2 py-2.5 pl-7 pr-3 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none" />
            </div>
            {errors.price && <p className="mt-1 text-xs text-rose-400">{errors.price.message}</p>}
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Quantity</label>
            <input {...register("quantity")} type="number" min={1} max={99}
              className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none" />
          </div>
        </div>
      )}

      {/* Auction fields */}
      {listingType === "auction" && (
        <div className="space-y-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4">
          <p className="text-xs font-semibold text-yellow-400">Auction settings</p>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Starting price (₱) *</label>
              <input {...register("startingPrice")} type="number" min={1} step={0.01} placeholder="0.00"
                className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none" />
              {errors.startingPrice && <p className="mt-1 text-xs text-rose-400">{errors.startingPrice.message}</p>}
            </div>
            <div className="w-32">
              <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Bid increment (₱)</label>
              <input {...register("bidIncrement")} type="number" min={1} step={1} placeholder="50"
                className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Reserve price (₱, optional)</label>
              <input {...register("reservePrice")} type="number" min={1} step={0.01} placeholder="Minimum to sell"
                className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Auction ends *</label>
              <input {...register("auctionEnd")} type="datetime-local"
                min={new Date(Date.now() + 3_600_000).toISOString().slice(0, 16)}
                className="w-full rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] focus:border-accent/50 focus:outline-none" />
              {errors.auctionEnd && <p className="mt-1 text-xs text-rose-400">{errors.auctionEnd.message}</p>}
            </div>
          </div>

          <p className="text-[10px] text-[#9A9A9A]">
            Anti-snipe: bids in the final 30 seconds extend the auction by 30 seconds.
          </p>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="mb-1 block text-xs font-medium text-[#9A9A9A]">Description (optional)</label>
        <textarea {...register("description")} rows={3}
          placeholder="Describe the card's condition in detail, any creases, scratches, whitening…"
          className="w-full resize-none rounded-xl border border-white/10 bg-surface2 px-3 py-2.5 text-sm text-[#F2F2F2] placeholder:text-[#9A9A9A] focus:border-accent/50 focus:outline-none" />
      </div>

      {/* Photos */}
      <div>
        <label className="mb-2 block text-xs font-medium text-[#9A9A9A]">Photos (your actual card — not catalog art)</label>
        <PhotoUploader urls={photoUrls} onChange={setPhotoUrls} max={maxPhotos} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-[#9A9A9A] transition hover:text-[#F2F2F2]">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting || !selectedCard}
          className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50">
          {isSubmitting ? "Publishing…" : listingType === "auction" ? "Start Auction" : "Publish Listing"}
        </button>
      </div>
    </form>
  );
}
