import type { Metadata, Viewport } from "next";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import { MVPBanner } from "@/components/MVPBanner";
import Script from "next/script";
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

const SITE_URL = "https://tcgmarket.ph";
const SITE_NAME = "TCGMarket PH";
const DEFAULT_TITLE = "TCGMarket PH — Buy & Sell TCG Cards in the Philippines";
const DEFAULT_DESCRIPTION =
  "The Philippines' premier marketplace for Pokémon, One Piece, Yu-Gi-Oh!, and Magic: The Gathering cards.";

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  other: { "mobile-web-app-capable": "yes" },
  icons: {
    icon:  [{ url: "/icons/icon-192", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/icon-192", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: "en_PH",
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
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
        <Providers>
          {children}
          <MVPBanner />
        </Providers>
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
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
