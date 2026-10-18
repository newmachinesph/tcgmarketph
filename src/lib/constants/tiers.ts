export const TIER_LIMITS = {
  free: {
    maxActiveListings:    10,
    maxPhotosPerListing:   1,
    canCreateAuction:  false,
    maxSearchResults:      5,
    commissionRate:        0,
  },
  power_seller: {
    maxActiveListings:    50,
    maxPhotosPerListing:   3,
    canCreateAuction:   true,
    maxSearchResults:     25,
    commissionRate:        0,
  },
} as const satisfies Record<string, {
  maxActiveListings: number;
  maxPhotosPerListing: number;
  canCreateAuction: boolean;
  maxSearchResults: number;
  commissionRate: number;
}>;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier as SubscriptionTier] ?? TIER_LIMITS.free;
}
