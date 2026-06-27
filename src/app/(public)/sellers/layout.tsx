import type { Metadata } from "next";

const title = "Find Sellers — TCGMarket PH";
const description =
  "Browse verified TCG card sellers across the Philippines. Find Pokémon and One Piece TCG sellers near you for cash-on-meetup trades.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://tcgmarket.ph/sellers" },
  openGraph: { title, description, url: "https://tcgmarket.ph/sellers" },
  twitter: { card: "summary_large_image", title, description },
};

export default function SellersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
