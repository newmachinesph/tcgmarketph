"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, TagIcon } from "@heroicons/react/24/outline";

interface Photo { id: string; url: string; order: number; }

export function ListingGallery({
  photos,
  cardName,
  fallbackImageUrl,
}: {
  photos: Photo[];
  cardName: string;
  fallbackImageUrl?: string | null;
}) {
  const [idx, setIdx] = useState(0);

  if (photos.length === 0) {
    if (fallbackImageUrl) {
      return (
        <div className="relative aspect-[3/4] max-h-[480px] overflow-hidden rounded-2xl bg-surface2">
          <Image
            src={fallbackImageUrl}
            alt={cardName}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-contain"
          />
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/70">
            Card art (no seller photo)
          </span>
        </div>
      );
    }
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-white/10 bg-surface2">
        <div className="flex flex-col items-center gap-2 text-white/20">
          <TagIcon className="size-12" />
          <p className="text-sm">No photos</p>
        </div>
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <div className="space-y-2">
      {/* Main photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface2">
        <Image src={photos[idx].url} alt={`${cardName} photo ${idx + 1}`} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-contain" />
        {photos.length > 1 && (
          <>
            <button onClick={prev} aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80">
              <ChevronLeftIcon className="size-4" />
            </button>
            <button onClick={next} aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80">
              <ChevronRightIcon className="size-4" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              {idx + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button key={p.id} onClick={() => setIdx(i)} aria-label={`Photo ${i + 1}`}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === idx ? "border-accent" : "border-transparent opacity-60 hover:opacity-100"}`}>
              <Image src={p.url} alt={`Thumbnail ${i + 1}`} fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
