import type { MetadataRoute } from "next";
import { db }        from "@/lib/db";
import { listings }  from "@/db/schema/listings";
import { user }      from "@/db/schema/auth";
import { eq }        from "drizzle-orm";

const BASE = "https://tcgmarket.ph";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [activeListings, sellers] = await Promise.all([
    db
      .select({ slug: listings.slug, id: listings.id, updatedAt: listings.updatedAt })
      .from(listings)
      .where(eq(listings.status, "active")),
    db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.sellerEnabled, true)),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                      changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/marketplace`,     changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE}/auction`,         changeFrequency: "hourly",  priority: 0.8 },
    { url: `${BASE}/sellers`,         changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/about`,           changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/faq`,             changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/safety`,          changeFrequency: "monthly", priority: 0.5 },
  ];

  const listingPages: MetadataRoute.Sitemap = activeListings.map((l) => ({
    url:              `${BASE}/listings/${l.slug ?? l.id}`,
    lastModified:     l.updatedAt,
    changeFrequency:  "daily" as const,
    priority:         0.6,
  }));

  const sellerPages: MetadataRoute.Sitemap = sellers.map((s) => ({
    url:             `${BASE}/sellers/${s.id}`,
    changeFrequency: "weekly" as const,
    priority:        0.5,
  }));

  return [...staticPages, ...listingPages, ...sellerPages];
}
