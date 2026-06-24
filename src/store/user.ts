import { create } from "zustand";

// Mirrors the session user shape with our additional fields.
// Populated once on login via Better Auth's useSession — use this
// for any client component that needs user data without prop-drilling.
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  phone?: string | null;
  phoneVerified?: boolean;
  city?: string | null;
  bio?: string | null;
  games?: string | null;
  kycStatus?: string;
  sellerEnabled?: boolean;
  subscriptionTier?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  reputationScore?: number;
}

interface UserStore {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  patchProfile: (patch: Partial<UserProfile>) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  patchProfile: (patch) =>
    set((s) => ({
      profile: s.profile ? { ...s.profile, ...patch } : null,
    })),
}));
