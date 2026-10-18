/**
 * Authenticated API tests.
 *
 * Strategies:
 *  - Sign in ONCE per role (buyer / seller) in beforeAll to avoid rate-limit 429s.
 *  - Use shared APIRequestContext objects across all tests in this file.
 *  - Each shared context automatically carries the session cookie.
 */
import { test, expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { TEST_USERS } from "../helpers/auth";

let buyerCtx:  APIRequestContext;
let sellerCtx: APIRequestContext;

test.describe("Authenticated API tests", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ playwright }) => {
    buyerCtx  = await playwright.request.newContext({ baseURL: "http://localhost:3000" });
    sellerCtx = await playwright.request.newContext({ baseURL: "http://localhost:3000" });

    const [br, sr] = await Promise.all([
      buyerCtx.post("/api/auth/sign-in/email", {
        data:    TEST_USERS.buyer,
        headers: { "Content-Type": "application/json" },
      }),
      sellerCtx.post("/api/auth/sign-in/email", {
        data:    TEST_USERS.seller,
        headers: { "Content-Type": "application/json" },
      }),
    ]);

    if (!br.ok())  throw new Error(`buyer login failed:  ${br.status()}  ${await br.text()}`);
    if (!sr.ok())  throw new Error(`seller login failed: ${sr.status()} ${await sr.text()}`);
  });

  test.afterAll(async () => {
    await buyerCtx?.dispose();
    await sellerCtx?.dispose();
  });

  // ─── Collection ─────────────────────────────────────────────────────────────

  test("GET /api/collection returns entries array", async () => {
    const res  = await buyerCtx.get("/api/collection");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("entries");
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test("POST /api/collection adds a card (201 or 409 if duplicate)", async () => {
    const mkt      = await buyerCtx.get("/api/marketplace?limit=1");
    const listings = (await mkt.json()).listings ?? [];
    if (!listings.length) return test.skip();
    const cardId = listings[0].card.id;

    const res = await buyerCtx.post("/api/collection", {
      data: { cardId, condition: "near_mint", quantity: 1 },
    });
    // 201 = added, 409 = already in collection (conflict)
    expect([201, 409]).toContain(res.status());
    if (res.status() === 201) {
      const body = await res.json();
      expect(body).toHaveProperty("entry");
    }
  });

  test("POST /api/collection rejects invalid condition → 400 or 422", async () => {
    const mkt      = await buyerCtx.get("/api/marketplace?limit=1");
    const listings = (await mkt.json()).listings ?? [];
    if (!listings.length) return test.skip();
    const cardId = listings[0].card.id;

    const res = await buyerCtx.post("/api/collection", {
      data: { cardId, condition: "fake_condition", quantity: 1 },
    });
    expect([400, 422]).toContain(res.status());
  });

  // ─── Wishlist ────────────────────────────────────────────────────────────────

  test("GET /api/wishlist returns entries array", async () => {
    const res  = await buyerCtx.get("/api/wishlist");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test("POST /api/wishlist adds a card (or 409 if already present)", async () => {
    // Use a card from the marketplace — guaranteed to be in the local DB
    const mkt     = await buyerCtx.get("/api/marketplace?limit=1");
    const listings = (await mkt.json()).listings ?? [];
    if (!listings.length) return test.skip();
    const cardId = listings[0].card.id;

    const res = await buyerCtx.post("/api/wishlist", {
      data: { cardId, priority: "medium", maxBuyPrice: 5000 },
    });
    // 201 = created, 409 = already on wishlist (idempotent re-add)
    expect([201, 409]).toContain(res.status());
  });

  // ─── Notifications ───────────────────────────────────────────────────────────

  test("GET /api/notifications returns array", async () => {
    const res  = await buyerCtx.get("/api/notifications");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.notifications ?? body)).toBe(true);
  });

  // ─── Conversations ───────────────────────────────────────────────────────────

  test("GET /api/conversations returns list", async () => {
    const res  = await buyerCtx.get("/api/conversations");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.conversations ?? body)).toBe(true);
  });

  // ─── Offers ──────────────────────────────────────────────────────────────────

  test("GET /api/offers returns array", async () => {
    const res  = await buyerCtx.get("/api/offers");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.offers ?? body)).toBe(true);
  });

  // ─── Transactions ────────────────────────────────────────────────────────────

  test("GET /api/transactions returns array", async () => {
    const res  = await buyerCtx.get("/api/transactions");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.transactions ?? body)).toBe(true);
  });

  // ─── My Listings (seller) ────────────────────────────────────────────────────

  test("GET /api/listings returns seller's own listings", async () => {
    const res  = await sellerCtx.get("/api/listings");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.listings ?? body)).toBe(true);
  });

  // ─── Bids ─────────────────────────────────────────────────────────────────────

  test("GET /api/bids/mine returns my bids", async () => {
    const res  = await buyerCtx.get("/api/bids/mine");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.bids ?? body)).toBe(true);
  });

  // ─── Blocks ──────────────────────────────────────────────────────────────────

  test("GET /api/blocks returns blocked users list", async () => {
    const res  = await buyerCtx.get("/api/blocks");
    expect(res.status()).toBe(200);
    const body = await res.json();
    // response shape: { blocks: [...] }
    expect(Array.isArray(body.blocks ?? body.blocked ?? body)).toBe(true);
  });

  // ─── Saved searches ──────────────────────────────────────────────────────────

  test("GET /api/saved-searches returns array", async () => {
    const res  = await buyerCtx.get("/api/saved-searches");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.searches ?? body)).toBe(true);
  });

  // ─── Price alerts ────────────────────────────────────────────────────────────

  test("GET /api/price-alerts returns array", async () => {
    const res  = await buyerCtx.get("/api/price-alerts");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.alerts ?? body)).toBe(true);
  });

  // ─── Analytics (seller) ──────────────────────────────────────────────────────

  test("GET /api/analytics/listings returns object", async () => {
    const res  = await sellerCtx.get("/api/analytics/listings");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body).toBe("object");
  });

  // ─── KYC ─────────────────────────────────────────────────────────────────────

  test("GET /api/kyc/status returns status object", async () => {
    const res  = await buyerCtx.get("/api/kyc/status");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body).toBe("object");
  });

  // ─── Account email prefs ─────────────────────────────────────────────────────

  test("GET /api/account/email-prefs returns prefs object", async () => {
    const res  = await buyerCtx.get("/api/account/email-prefs");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body).toBe("object");
  });

  // ─── Ownership guard: buyer cannot edit another seller's listing ─────────────

  test("PATCH /api/listings/[id] by non-owner → 404", async () => {
    // Get any listing ID from marketplace
    const mkt = await buyerCtx.get("/api/marketplace?limit=1");
    const listings = (await mkt.json()).listings ?? [];
    if (!listings.length) return test.skip();

    const listingId = listings[0].id;
    const res = await buyerCtx.patch(`/api/listings/${listingId}`, {
      data: { price: 999 },
    });
    // Buyer doesn't own it — should be 404 (not found for that user) or 403
    expect([403, 404]).toContain(res.status());
  });
});
