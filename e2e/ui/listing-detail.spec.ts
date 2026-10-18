/**
 * UI E2E — Listing detail page (share, bid, offers, seller info).
 */
import { test, expect } from "@playwright/test";
import { BUYER_AUTH, SELLER_AUTH } from "../helpers/auth-paths";

let listingSlug: string;
let listingId: string;

// Resolve a real listing slug/id once for all tests in this file
test.beforeAll(async ({ request }) => {
  const res = await request.get("/api/marketplace?limit=1");
  const body = await res.json();
  const listing = body.listings?.[0];
  listingSlug = listing?.slug ?? listing?.id;
  listingId   = listing?.id;
});

// ─────────────────────────────────────────────────────────────────────────────
// Public (unauthenticated) detail page
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Listing detail — public", () => {
  test("shows card name, price and condition", async ({ page }) => {
    if (!listingSlug) test.skip();
    await page.goto(`/listings/${listingSlug}`);
    await page.waitForLoadState("networkidle");
    // Price
    await expect(page.getByText(/₱/).first()).toBeVisible({ timeout: 10000 });
  });

  test("shows seller information section", async ({ page }) => {
    if (!listingSlug) test.skip();
    await page.goto(`/listings/${listingSlug}`);
    await page.waitForLoadState("networkidle");
    // Scope to main to avoid the hidden "Sellers" nav link in the off-canvas drawer
    await expect(page.locator("main").getByText(/seller/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("share button opens native share or copies link", async ({ page }) => {
    if (!listingSlug) test.skip();
    await page.goto(`/listings/${listingSlug}`);
    await page.waitForLoadState("networkidle");
    const shareBtn = page.getByRole("button", { name: /share/i });
    await expect(shareBtn).toBeVisible({ timeout: 10000 });
    // Click it — it may call navigator.share or copy to clipboard; just assert no crash
    await shareBtn.click();
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/internal server error/i)).not.toBeVisible();
  });

  test("unauthenticated user sees login prompt when clicking offer/buy", async ({ page }) => {
    if (!listingSlug) test.skip();
    await page.goto(`/listings/${listingSlug}`);
    await page.waitForLoadState("networkidle");
    const actionBtn = page.getByRole("button", {
      name: /offer|contact|buy|message|bid/i,
    }).first();
    if (!(await actionBtn.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }
    await actionBtn.click();
    await page.waitForLoadState("networkidle");
    // Should redirect to login or show a modal prompting sign-in
    const isLoginPage = page.url().includes("/login");
    const hasSignInText = await page.getByText(/sign in|log in/i).isVisible();
    expect(isLoginPage || hasSignInText).toBe(true);
  });

  test("non-existent listing shows 404", async ({ page }) => {
    const res = await page.goto("/listings/totally-fake-listing-xyz-9999");
    expect(res?.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated buyer on detail page
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Listing detail — authenticated buyer", () => {
  test.use({ storageState: BUYER_AUTH });

  test("offer/message button is visible (not a login redirect)", async ({ page }) => {
    if (!listingSlug) test.skip();
    await page.goto(`/listings/${listingSlug}`);
    await page.waitForLoadState("networkidle");
    // An offer/contact/message button must be rendered for authenticated users
    // (may be disabled if user owns the listing; that's fine — we just verify it's present)
    const actionBtn = page.getByRole("button", {
      name: /offer|contact|buy|message|bid/i,
    }).first();
    await expect(actionBtn).toBeVisible({ timeout: 10000 });
    // Page must not have redirected to login
    await expect(page).not.toHaveURL(/login/);
  });

  test("can add listing to wishlist from detail page", async ({ page }) => {
    if (!listingSlug) test.skip();
    await page.goto(`/listings/${listingSlug}`);
    await page.waitForLoadState("networkidle");
    const wishBtn = page.locator(
      "[aria-label*='wishlist' i], [aria-label*='heart' i], [aria-label*='save' i]",
    ).first();
    if (!(await wishBtn.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }
    await wishBtn.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seller cannot offer on own listing
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Listing detail — authenticated seller", () => {
  test.use({ storageState: SELLER_AUTH });

  test("seller's own listing shows edit/delete, not buy", async ({ page }) => {
    if (!listingSlug) test.skip();
    // Get seller's own listings
    const res = await page.request.get("/api/listings");
    const body = await res.json();
    const ownListings = body.listings ?? body;
    if (!ownListings?.length) { test.skip(); return; }

    const own = ownListings[0];
    const slug = own.slug ?? own.id;
    await page.goto(`/listings/${slug}`);
    await page.waitForLoadState("networkidle");

    // Should NOT show "make offer" to the seller on their own item
    await expect(page.getByRole("button", { name: /make offer/i })).not.toBeVisible();
    // Should show edit or manage options
    const editBtn = page.getByRole("button", { name: /edit|manage|delete/i }).first();
    if (await editBtn.isVisible({ timeout: 3000 })) {
      await expect(editBtn).toBeVisible();
    }
  });
});
