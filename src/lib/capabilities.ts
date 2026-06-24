import { db } from "./db";
import { eq } from "drizzle-orm";
import { user } from "@/db/schema/auth";

export type UserCapabilities = {
  canBrowse: boolean;
  canList: boolean;
  canSell: boolean;
  isKycVerified: boolean;
  isPowerSeller: boolean;
  isAdmin: boolean;
  isBanned: boolean;
};

export async function getUserCapabilities(userId: string): Promise<UserCapabilities> {
  const u = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!u) throw new Error("User not found");
  return {
    canBrowse:     !u.isBanned,
    canList:       u.phoneVerified && !u.isBanned,
    canSell:       u.sellerEnabled && !u.isBanned,
    isKycVerified: u.kycStatus === "verified",
    isPowerSeller: u.subscriptionTier === "power_seller",
    isAdmin:       u.isAdmin,
    isBanned:      u.isBanned,
  };
}
