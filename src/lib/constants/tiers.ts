export const TIER_LIMITS = {
  free: {
    maxActiveListings:  10,
    maxPhotosPerListing: 3,
    commissionRate:      0,   // % — placeholder for future monetization
  },
  power_seller: {
    maxActiveListings:  500,
    maxPhotosPerListing: 10,
    commissionRate:      0,
  },
} as const satisfies Record<string, { maxActiveListings: number; maxPhotosPerListing: number; commissionRate: number }>;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier as SubscriptionTier] ?? TIER_LIMITS.free;
}
