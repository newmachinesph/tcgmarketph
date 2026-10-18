import type { Metadata } from "next";

const title = "Marketplace — TCGMarket PH";
const description =
  "Browse Pokémon and One Piece TCG cards for sale across the Philippines. Filter by game, condition, price, and city. Cash on meetup — no fees.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://tcgmarket.ph/marketplace" },
  openGraph: { title, description, url: "https://tcgmarket.ph/marketplace" },
  twitter: { card: "summary_large_image", title, description },
};

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
