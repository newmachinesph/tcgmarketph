import MarketplacePage from "@/app/(public)/marketplace/page";

export const metadata = {
  title: "Live Auctions — TCGMarket PH",
  description: "Bid on Pokémon and One Piece cards in real-time. Anti-snipe protection. Free to bid.",
};

export default function AuctionPage() {
  return <MarketplacePage initialType="auction" />;
}
