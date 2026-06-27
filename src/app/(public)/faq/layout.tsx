import type { Metadata } from "next";

const title = "FAQ — TCGMarket PH";
const description =
  "Frequently asked questions about buying and selling TCG cards on TCGMarket PH. How cash-on-meetup trading works, safety tips, and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://tcgmarket.ph/faq" },
  openGraph: { title, description, url: "https://tcgmarket.ph/faq" },
  twitter: { card: "summary_large_image", title, description },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
