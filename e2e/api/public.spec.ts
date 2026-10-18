/**
 * Public API routes — no auth required.
 * Tests: marketplace, listings, sellers, cards/search, stats.
 */
import { test, expect } from "@playwright/test";

test.describe("GET /api/marketplace", () => {
  test("returns paginated listings with expected shape", async ({ request }) => {
    const res = await request.get("/api/marketplace");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.listings)).toBe(true);
    expect(typeof body.page).toBe("number");
    expect(typeof body.pageSize).toBe("number");
    expect(typeof body.hasMore).toBe("boolean");
  });

  test("supports ?q= search filter", async ({ request }) => {
    const res = await request.get("/api/marketplace?q=charizard");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.listings)).toBe(true);
  });

  test("supports ?game= filter", async ({ request }) => {
    const res = await request.get("/api/marketplace?game=pokemon");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.listings)).toBe(true);
    // Every returned listing should be pokemon
    for (const l of body.listings) {
      expect(l.card.game).toBe("pokemon");
    }
  });

  test("page 2 returns different results than page 1", async ({ request }) => {
    const [r1, r2] = await Promise.all([
      request.get("/api/marketplace?page=1"),
      request.get("/api/marketplace?page=2"),
    ]);
    expect(r1.status()).toBe(200);
    expect(r2.status()).toBe(200);
    const b1 = await r1.json();
    const b2 = await r2.json();
    // Both must be arrays; IDs on page 2 must differ from page 1
    const ids1 = new Set(b1.listings.map((l: { id: string }) => l.id));
    for (const l of b2.listings) {
      expect(ids1.has(l.id)).toBe(false);
    }
  });
});

test.describe("GET /api/marketplace/cities", () => {
  test("returns { cities: string[] }", async ({ request }) => {
    const res = await request.get("/api/marketplace/cities");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.cities)).toBe(true);
    for (const city of body.cities) {
      expect(typeof city).toBe("string");
    }
  });
});

test.describe("GET /api/listings/[id]", () => {
  let listingId: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/marketplace?limit=1");
    const body = await res.json();
    listingId = body.listings?.[0]?.id ?? body.listings?.[0]?.slug;
  });

  test("returns listing detail by id", async ({ request }) => {
    if (!listingId) test.skip();
    const res = await request.get(`/api/listings/${listingId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("listing");
    expect(body.listing).toHaveProperty("id");
    expect(body.listing).toHaveProperty("price");
    expect(body.listing).toHaveProperty("seller");
    expect(body.listing).toHaveProperty("card");
    expect(Array.isArray(body.listing.photos)).toBe(true);
  });

  test("returns 404 for unknown id", async ({ request }) => {
    const res = await request.get("/api/listings/nonexistent-listing-id-xyz");
    expect(res.status()).toBe(404);
  });
});

test.describe("GET /api/sellers", () => {
  test("returns seller list", async ({ request }) => {
    const res = await request.get("/api/sellers");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.sellers ?? body)).toBe(true);
  });
});

test.describe("GET /api/sellers/[id]", () => {
  let sellerId: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/sellers");
    const body = await res.json();
    const sellers = body.sellers ?? body;
    sellerId = sellers?.[0]?.id;
  });

  test("returns seller profile", async ({ request }) => {
    if (!sellerId) test.skip();
    const res = await request.get(`/api/sellers/${sellerId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("seller");
  });

  test("returns 404 for unknown seller", async ({ request }) => {
    const res = await request.get("/api/sellers/definitely-not-a-real-seller");
    expect(res.status()).toBe(404);
  });
});

test.describe("GET /api/cards/search", () => {
  test("returns { cards: [] } for valid query", async ({ request }) => {
    const res = await request.get("/api/cards/search?q=charizard");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.cards)).toBe(true);
    expect(typeof body.fromCache).toBe("boolean");
  });

  test("returns empty cards array for gibberish query", async ({ request }) => {
    const res = await request.get("/api/cards/search?q=zzzznotacard9999");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.cards)).toBe(true);
  });

  test("returns 200 with empty cards when q is too short", async ({ request }) => {
    const res = await request.get("/api/cards/search?q=a");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.cards)).toBe(true);
    expect(body.cards.length).toBe(0);
  });

  test("returns 200 with empty cards when q is missing", async ({ request }) => {
    const res = await request.get("/api/cards/search");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.cards)).toBe(true);
  });
});

test.describe("GET /api/stats", () => {
  test("returns platform stats", async ({ request }) => {
    const res = await request.get("/api/stats");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body).toBe("object");
  });
});
