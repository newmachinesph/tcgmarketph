import type { MetadataRoute } from "next";

const BASE = "https://tcgmarket.ph";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                      changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/marketplace`,     changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/auction`,         changeFrequency: "hourly",  priority: 0.8 },
    { url: `${BASE}/sellers`,         changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/about`,           changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`,             changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/safety`,          changeFrequency: "monthly", priority: 0.5 },
  ];
}
