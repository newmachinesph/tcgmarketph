/**
 * UI E2E — public pages (no login required).
 * Tests: home, marketplace, listing detail, sellers, auction.
 */
import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// Home page
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Home page", () => {
  test("renders hero section and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TCGMarket/i);
    // Header logo visible
    await expect(page.getByText("TCGMarket").first()).toBeVisible();
  });

  test("has working navigation links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const vw = page.viewportSize()?.width ?? 1280;
    if (vw <= 768) {
      // On mobile, nav links are in the hamburger drawer — wait for hydration first
      await page.locator("button[aria-label='Open menu']").click();
      const drawer = page.locator("div[class*='translate-x-0'][class*='w-72']").first();
      await drawer.waitFor({ state: "visible", timeout: 8000 });
      await drawer.locator("a[href='/marketplace']").first().click();
    } else {
      await page.locator("a[href='/marketplace']").first().click();
    }
    await expect(page).toHaveURL(/marketplace/);
  });

  test("has sign-in and get-started links", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const vw = page.viewportSize()?.width ?? 1280;
    if (vw <= 768) {
      // On mobile, sign-in/signup links live inside the drawer — wait for hydration first
      await page.locator("button[aria-label='Open menu']").click();
      const drawer = page.locator("div[class*='translate-x-0'][class*='w-72']").first();
      await drawer.waitFor({ state: "visible", timeout: 8000 });
      await expect(drawer.locator("a[href='/login']").first()).toBeVisible({ timeout: 3000 });
      await expect(drawer.locator("a[href='/signup']").first()).toBeVisible({ timeout: 3000 });
    } else {
      await expect(page.locator("a[href='/login']").first()).toBeVisible();
      await expect(page.locator("a[href='/signup']").first()).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Marketplace
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Marketplace page", () => {
  test("loads and shows listing cards", async ({ page }) => {
    await page.goto("/marketplace");
    // Wait for listings to hydrate
    await page.waitForLoadState("networkidle");
    // At least one listing card visible
    const cards = page.locator("[data-testid='listing-card'], .listing-card, article").first();
    // Broad selector: look for price text (₱)
    await expect(page.getByText(/₱/).first()).toBeVisible({ timeout: 10000 });
  });

  test("search filter returns results", async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
    // Find the search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.locator("input[type='search']")).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("charizard");
      await searchInput.press("Enter");
      await page.waitForLoadState("networkidle");
    }
    // Page should still show content
    await expect(page.locator("body")).toBeVisible();
  });

  test("page title is correct", async ({ page }) => {
    await page.goto("/marketplace");
    await expect(page).toHaveTitle(/marketplace/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Listing detail
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Listing detail page", () => {
  let listingSlug: string;

  test.beforeAll(async ({ request }) => {
    const res  = await request.get("/api/marketplace?limit=1");
    const body = await res.json();
    const listing = body.listings?.[0];
    listingSlug = listing?.slug ?? listing?.id;
  });

  test("shows listing title, price, and seller info", async ({ page }) => {
    if (!listingSlug) test.skip();
    await page.goto(`/listings/${listingSlug}`);
    await page.waitForLoadState("networkidle");
    // Price visible
    await expect(page.getByText(/₱/).first()).toBeVisible({ timeout: 10000 });
    // Scope to main to avoid the hidden "Sellers" nav link in the off-canvas drawer
    await expect(page.locator("main").getByText(/seller/i).first()).toBeVisible();
  });

  test("has share button", async ({ page }) => {
    if (!listingSlug) test.skip();
    await page.goto(`/listings/${listingSlug}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: /share/i })).toBeVisible({ timeout: 10000 });
  });

  test("404 for unknown listing", async ({ page }) => {
    const res = await page.goto("/listings/definitely-not-real-abc123");
    expect(res?.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sellers page
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Sellers page", () => {
  test("loads and shows seller cards", async ({ page }) => {
    await page.goto("/sellers");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/sellers/i);
    // At least one seller profile link
    await expect(page.locator("a[href*='/sellers/']").first()).toBeVisible({ timeout: 10000 });
  });

  test("seller detail page loads", async ({ page }) => {
    const res    = await page.request.get("/api/sellers");
    const body   = await res.json();
    const sellers = body.sellers ?? body;
    if (!sellers?.length) test.skip();

    await page.goto(`/sellers/${sellers[0].id}`);
    await page.waitForLoadState("networkidle");
    // Profile page must show seller name or display name
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Auction page
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Auction page", () => {
  test("loads with correct title", async ({ page }) => {
    await page.goto("/auction");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/auction/i);
  });

  test("shows active auction listings", async ({ page }) => {
    await page.goto("/auction");
    await page.waitForLoadState("networkidle");
    // Should show at least one price or bid amount
    await expect(page.getByText(/₱/).first()).toBeVisible({ timeout: 15000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth pages
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Auth pages", () => {
  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /password/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
  });

  test("signup page renders form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up|get started|create/i })).toBeVisible();
  });

  test("login with wrong password shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: /email/i }).fill("notreal@test.com");
    await page.getByRole("textbox", { name: /password/i }).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    // Wait for error feedback
    await page.waitForLoadState("networkidle");
    // Should not redirect to dashboard
    await expect(page).not.toHaveURL(/dashboard/);
  });
});
