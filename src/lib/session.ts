import type { auth } from "./auth";

// Extended user shape that includes all Better Auth additionalFields.
// Use this everywhere instead of inline `as` casts.
export type ExtendedUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>["user"] & {
  displayName?: string | null;
  phone?: string | null;
  phoneVerified?: boolean;
  city?: string | null;
  bio?: string | null;
  games?: string | null;
  kycStatus?: string;
  sellerEnabled?: boolean;
  subscriptionTier?: string;
  isAdmin?: boolean;
  reputationScore?: number;
  isBanned?: boolean;
};
