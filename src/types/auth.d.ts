import type { Session, User } from "better-auth";

// Extend Better Auth's User type with the custom fields stored in the database.
// Avoids `as unknown & { ... }` casts throughout the app.
declare module "better-auth" {
  interface User {
    displayName?: string | null;
    phone?: string | null;
    phoneVerified?: boolean;
    kycStatus?: string;
    sellerEnabled?: boolean;
    subscriptionTier?: string;
    reputationScore?: number;
    preferredCurrency?: string;
    isAdmin?: boolean;
    city?: string | null;
    bio?: string | null;
    games?: string | null;
  }
}
