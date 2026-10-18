import type { Metadata } from "next";
import { UpgradeClient } from "./UpgradeClient";

export const metadata: Metadata = {
  title: "Power Seller — TCGMarket PH",
  description: "Upgrade to Power Seller and unlock up to 500 active listings, 10 photos per listing, and a verified badge.",
};

export default function UpgradePage() {
  return <UpgradeClient />;
}
