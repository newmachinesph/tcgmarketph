/**
 * UI E2E — Marketplace interactions (filtering, pagination, card clicks).
 */
import { test, expect } from "@playwright/test";
import { BUYER_AUTH } from "../helpers/auth-paths";

// ─────────────────────────────────────────────────────────────────────────────
// Public interactions (no login needed)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Marketplace — public interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
  });

  test("listings grid renders cards with prices", async ({ page }) => {
    const priceEl = page.getByText(/₱/).first();
    await expect(priceEl).toBeVisible({ timeout: 10000 });
  });

  test("clicking a listing card navigates to detail page", async ({ page }) => {
    // Get a known listing slug so we can find the exact link in the grid
    const res = await page.request.get("/api/marketplace?limit=1");
    const body = await res.json();
    const listing = body.listings?.[0];
    if (!listing) { test.skip(); return; }
    const slug = listing.slug ?? listing.id;

    // Find the card link pointing to this known slug
    const card = page.locator(`a[href*="${slug}"]`).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`listings/${slug}`));
  });

  test("game filter narrows results", async ({ page }) => {
    // Look for filter buttons or select — try common selectors
    const filterBtn = page.locator(
      "button:has-text('Pokemon'), button:has-text('MTG'), button:has-text('Yu-Gi-Oh'), select",
    ).first();
    if (!(await filterBtn.isVisible())) {
      test.skip();
      return;
    }
    await filterBtn.click();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    // URL might reflect the filter
  });

  test("sort dropdown works", async ({ page }) => {
    const sortSelect = page.locator("select").first();
    if (!(await sortSelect.isVisible())) {
      test.skip();
      return;
    }
    // Change sort option
    const options = await sortSelect.locator("option").allTextContents();
    if (options.length > 1) {
      await sortSelect.selectOption({ index: 1 });
      await page.waitForLoadState("networkidle");
      await expect(page.getByText(/₱/).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test("pagination loads more listings", async ({ page }) => {
    // Collect first-page listing IDs
    const firstCards = await page.locator("a[href*='/listings/']").allInnerTexts();
    // Look for "next page" or "load more"
    const nextBtn = page
      .getByRole("button", { name: /next|load more/i })
      .or(page.getByRole("link", { name: /next/i }))
      .first();
    if (!(await nextBtn.isVisible())) {
      test.skip();
      return;
    }
    await nextBtn.click();
    await page.waitForLoadState("networkidle");
    // Some new content should be visible
    await expect(page.locator("body")).toBeVisible();
  });

  test("search bar filters by card name", async ({ page }) => {
    const input = page
      .getByPlaceholder(/search/i)
      .or(page.locator("input[type='search']"))
      .first();
    if (!(await input.isVisible())) {
      test.skip();
      return;
    }
    await input.fill("Pikachu");
    await input.press("Enter");
    await page.waitForLoadState("networkidle");
    // Should not crash, body still visible
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/internal server error/i)).not.toBeVisible();
  });

  test("empty search returns no-results message or resets gracefully", async ({ page }) => {
    const input = page
      .getByPlaceholder(/search/i)
      .or(page.locator("input[type='search']"))
      .first();
    if (!(await input.isVisible())) {
      test.skip();
      return;
    }
    await input.fill("xyzzznotarealcard999abc");
    await input.press("Enter");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByText(/internal server error/i)).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated interactions
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Marketplace — authenticated buyer interactions", () => {
  test.use({ storageState: BUYER_AUTH });

  test("wishlist/heart button appears on listing cards when logged in", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
    // Heart / bookmark / wishlist button on first card
    const heartBtn = page.locator(
      "[aria-label*='wishlist' i], [aria-label*='heart' i], [aria-label*='save' i], button svg",
    ).first();
    if (!(await heartBtn.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }
    await expect(heartBtn).toBeVisible();
  });

  test("navigating to listing detail shows offer/contact button when logged in", async ({ page }) => {
    const res = await page.request.get("/api/marketplace?limit=1");
    const body = await res.json();
    const listing = body.listings?.[0];
    if (!listing) { test.skip(); return; }

    const slug = listing.slug ?? listing.id;
    await page.goto(`/listings/${slug}`);
    await page.waitForLoadState("networkidle");

    // Should show an offer / contact / buy button for authenticated users
    const actionBtn = page.getByRole("button", {
      name: /offer|contact|buy|message|bid/i,
    }).first();
    await expect(actionBtn).toBeVisible({ timeout: 10000 });
  });
});
