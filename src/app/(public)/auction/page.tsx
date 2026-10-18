import type { Metadata } from "next";
import MarketplacePage from "@/app/(public)/marketplace/page";

const SITE_URL = "https://tcgmarket.ph";

export const metadata: Metadata = {
  title: "Live Auctions — TCGMarket PH",
  description: "Bid on Pokémon and One Piece cards in real-time. Anti-snipe protection. Free to bid.",
  alternates: { canonical: `${SITE_URL}/auction` },
  openGraph: {
    title: "Live Auctions — TCGMarket PH",
    description: "Bid on Pokémon and One Piece cards in real-time. Anti-snipe protection. Free to bid.",
    url: `${SITE_URL}/auction`,
    siteName: "TCGMarket PH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Auctions — TCGMarket PH",
    description: "Bid on Pokémon and One Piece cards in real-time. Anti-snipe protection. Free to bid.",
  },
};

export default function AuctionPage() {
  return <MarketplacePage initialType="auction" />;
}
