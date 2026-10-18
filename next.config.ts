import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // unsafe-eval is only needed in development for Next.js HMR
      // GA4's gtag.js dynamically loads chunks from google-analytics.com
      `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      // Google OAuth uses an iframe on accounts.google.com
      "frame-src 'self' https://accounts.google.com",
      // Ably realtime (WebSocket + HTTP fallback + connectivity check)
      // Google Analytics + OAuth endpoints
      "connect-src 'self' https://accounts.google.com https://*.neon.tech" +
        " wss://*.ably.io wss://*.ably-realtime.com https://*.ably.io https://*.ably-realtime.com" +
        " https://internet-up.ably-realtime.com" +
        " https://oauth2.googleapis.com https://openidconnect.googleapis.com https://*.googleapis.com" +
        " https://www.google-analytics.com https://analytics.google.com" +
        " https://region1.google-analytics.com https://www.googletagmanager.com" +
        " https://stats.g.doubleclick.net",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["inngest"],
  images: {
    // Allow any HTTPS image source — card images come from various TCG CDNs
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
