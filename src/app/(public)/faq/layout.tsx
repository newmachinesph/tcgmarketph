import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — TCGMarket PH",
  description:
    "Frequently asked questions about buying and selling TCG cards on TCGMarket PH. How cash-on-meetup trading works, safety tips, and more.",
  alternates: { canonical: "https://tcgmarket.ph/faq" },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
