import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Sellers — TCGMarket PH",
  description:
    "Browse verified TCG card sellers across the Philippines. Find Pokémon and One Piece TCG sellers near you for cash-on-meetup trades.",
  alternates: { canonical: "https://tcgmarket.ph/sellers" },
};

export default function SellersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
