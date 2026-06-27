import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

async function getSeller(id: string) {
  const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/sellers/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.seller ?? null;
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { id } = await params;
  const seller = await getSeller(id);
  if (!seller) return { title: "Seller not found — TCGMarket PH" };

  const name = seller.displayName ?? seller.name;
  const deals = seller.completedDeals ?? 0;
  const location = seller.city ? ` · ${seller.city}` : "";

  const title = `${name} — TCGMarket PH`;
  const description = `${name} has ${deals} completed deal${deals !== 1 ? "s" : ""}${location}. Browse their Pokémon and One Piece TCG card listings.`;

  return {
    title,
    description,
    alternates: { canonical: `https://tcgmarket.ph/sellers/${id}` },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://tcgmarket.ph/sellers/${id}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
