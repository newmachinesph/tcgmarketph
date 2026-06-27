import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace — TCGMarket PH",
  description:
    "Browse Pokémon and One Piece TCG cards for sale across the Philippines. Filter by game, condition, price, and city. Cash on meetup — no fees.",
  alternates: { canonical: "https://tcgmarket.ph/marketplace" },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
