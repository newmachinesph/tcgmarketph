/**
 * Auth-guard tests — every protected API route must return 401 when called
 * without a session cookie.
 */
import { test, expect } from "@playwright/test";

const PROTECTED_GET: string[] = [
  "/api/collection",
  "/api/collection/folders",
  "/api/wishlist",
  "/api/listings",           // my listings (app)
  "/api/listings/template",
  "/api/offers",
  "/api/bids/mine",
  "/api/conversations",
  "/api/notifications",
  "/api/transactions",
  "/api/analytics/listings",
  "/api/account/email-prefs",
  "/api/kyc/status",
  "/api/saved-searches",
  "/api/price-alerts",
  "/api/blocks",
];

// Admin routes return 403 (admin-role check) rather than 401 (unauthenticated)
const ADMIN_ONLY_GET: string[] = [
  "/api/admin/stats",
  "/api/admin/users",
  "/api/admin/reports",
  "/api/admin/disputes",
  "/api/admin/metrics",
];

const PROTECTED_POST: string[] = [
  "/api/listings",
  "/api/offers",
  "/api/ratings",
  "/api/reports",
  "/api/conversations",
  "/api/saved-searches",
  "/api/price-alerts",
  "/api/blocks",
  "/api/collection",
  "/api/wishlist",
  "/api/otp/send",
];

for (const path of PROTECTED_GET) {
  test(`GET ${path} → 401 without session`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(401);
  });
}

for (const path of ADMIN_ONLY_GET) {
  test(`GET ${path} → 403 without admin session`, async ({ request }) => {
    const res = await request.get(path);
    // Admin routes return 403 (admin-role check) for unauthenticated callers
    expect(res.status()).toBe(403);
  });
}

for (const path of PROTECTED_POST) {
  test(`POST ${path} → 401 without session`, async ({ request }) => {
    const res = await request.post(path, { data: {} });
    expect(res.status()).toBe(401);
  });
}

// PATCH / DELETE guards on resource routes
test("PATCH /api/listings/[id] → 401 without session", async ({ request }) => {
  const res = await request.patch("/api/listings/some-listing-id", {
    data: { price: 999 },
  });
  expect(res.status()).toBe(401);
});

test("DELETE /api/listings/[id] → 401 without session", async ({ request }) => {
  const res = await request.delete("/api/listings/some-listing-id");
  expect(res.status()).toBe(401);
});

test("PATCH /api/offers/[id] → 401 without session", async ({ request }) => {
  const res = await request.patch("/api/offers/some-offer-id", { data: {} });
  expect(res.status()).toBe(401);
});

test("DELETE /api/collection/[id] → 401 without session", async ({ request }) => {
  const res = await request.delete("/api/collection/some-id");
  expect(res.status()).toBe(401);
});

test("DELETE /api/wishlist/[id] → 401 without session", async ({ request }) => {
  const res = await request.delete("/api/wishlist/some-id");
  expect(res.status()).toBe(401);
});

test("PATCH /api/transactions/[id] → 401 without session", async ({ request }) => {
  const res = await request.patch("/api/transactions/some-id", { data: {} });
  expect(res.status()).toBe(401);
});
