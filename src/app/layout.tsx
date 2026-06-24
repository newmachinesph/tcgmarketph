import type { Metadata } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TCGMarket PH — Buy & Sell TCG Cards in the Philippines",
  description:
    "The Philippines' premier marketplace for Pokémon, One Piece, Yu-Gi-Oh!, and Magic: The Gathering cards.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1E1E1E",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F2F2F2",
              },
            }}
          />
        </body>
    </html>
  );
}
