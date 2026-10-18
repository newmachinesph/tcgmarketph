export function toListingSlug(cardName: string, listingId: string): string {
  const base = cardName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, 45) || "card";
  return `${base}-${listingId.slice(0, 8)}`;
}
