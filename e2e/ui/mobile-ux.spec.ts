/**
 * UI E2E — Mobile UX (runs on both desktop and mobile projects).
 * Mobile-nav tests skip themselves at desktop viewports (> 768px wide).
 */
import { test, expect } from "@playwright/test";
import { BUYER_AUTH } from "../helpers/auth-paths";

function skipIfDesktop(page: import("@playwright/test").Page) {
  const vw = page.viewportSize()?.width ?? 0;
  if (vw > 768) test.skip();
}

const HAMBURGER = "button[aria-label='Open menu']";

// ─────────────────────────────────────────────────────────────────────────────
// Public mobile nav (PublicMobileMenu — portals to body)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Mobile nav drawer — public", () => {
  test("hamburger button opens the left drawer", async ({ page }) => {
    skipIfDesktop(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator(HAMBURGER)).toBeVisible({ timeout: 8000 });
    await page.locator(HAMBURGER).click();
    const drawer = page.locator("div[class*='translate-x-0'][class*='w-72']").first();
    await drawer.waitFor({ state: "visible", timeout: 8000 });
    await expect(page.getByRole("link", { name: /marketplace/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test("drawer closes when overlay is clicked", async ({ page }) => {
    skipIfDesktop(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator(HAMBURGER).click();
    await page.locator("div[class*='translate-x-0'][class*='w-72']").first().waitFor({ state: "visible", timeout: 8000 });
    // Drawer is open — click to the right of the 288px panel
    await page.mouse.click(350, 300);
    await page.waitForTimeout(400);
    // After close the drawer has -translate-x-full; class*='translate-x-0' no longer matches the 72px panel
    await expect(page.locator("div[class*='translate-x-0'][class*='w-72']")).not.toBeVisible();
  });

  test("drawer spans full viewport height", async ({ page }) => {
    skipIfDesktop(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.locator(HAMBURGER).click();
    // Wait for open state, then measure via inset-y-0 selector
    await page.locator("div[class*='translate-x-0'][class*='w-72']").first().waitFor({ state: "visible", timeout: 8000 });
    const drawer = page.locator("div[class*='inset-y-0'][class*='w-72']").first();
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();
    const viewportHeight = page.viewportSize()?.height ?? 800;
    expect(box!.height).toBeGreaterThan(viewportHeight * 0.9);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated mobile drawer (AppHeader)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Mobile nav drawer — authenticated", () => {
  test.use({ storageState: BUYER_AUTH });

  test("authenticated drawer shows sign-out option", async ({ page }) => {
    skipIfDesktop(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.locator(HAMBURGER).click();
    await page.locator("div[class*='translate-x-0'][class*='w-72']").first().waitFor({ state: "visible", timeout: 8000 });
    await expect(
      page.getByRole("button", { name: /sign out|log out/i })
        .or(page.getByRole("link", { name: /sign out|log out/i }))
        .first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("authenticated drawer shows nav links", async ({ page }) => {
    skipIfDesktop(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.locator(HAMBURGER).click();
    await page.locator("div[class*='translate-x-0'][class*='w-72']").first().waitFor({ state: "visible", timeout: 8000 });
    await expect(
      page.getByRole("link", { name: /marketplace/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("authenticated drawer spans full viewport height", async ({ page }) => {
    skipIfDesktop(page);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.locator(HAMBURGER).click();
    await page.locator("div[class*='translate-x-0'][class*='w-72']").first().waitFor({ state: "visible", timeout: 8000 });
    const drawer = page.locator("div[class*='inset-y-0'][class*='w-72']").first();
    const box = await drawer.boundingBox();
    expect(box).not.toBeNull();
    const viewportHeight = page.viewportSize()?.height ?? 800;
    expect(box!.height).toBeGreaterThan(viewportHeight * 0.9);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile marketplace layout
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Marketplace — mobile layout", () => {
  test("loads and shows cards at mobile viewport", async ({ page }) => {
    skipIfDesktop(page);
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/₱/).first()).toBeVisible({ timeout: 10000 });
  });

  test("no horizontal overflow on marketplace (mobile)", async ({ page }) => {
    skipIfDesktop(page);
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 393;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test("listing card click navigates to detail (mobile)", async ({ page }) => {
    skipIfDesktop(page);
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
    const res = await page.request.get("/api/marketplace?limit=1");
    const body = await res.json();
    const listing = body.listings?.[0];
    if (!listing) { test.skip(); return; }
    const slug = listing.slug ?? listing.id;
    const card = page.locator(`a[href*="${slug}"]`).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(new RegExp(`listings/${slug}`));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mobile listing detail layout
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Listing detail — mobile layout", () => {
  let slug: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.get("/api/marketplace?limit=1");
    const body = await res.json();
    slug = body.listings?.[0]?.slug ?? body.listings?.[0]?.id;
  });

  test("no horizontal overflow on listing detail (mobile)", async ({ page }) => {
    skipIfDesktop(page);
    if (!slug) test.skip();
    await page.goto(`/listings/${slug}`);
    await page.waitForLoadState("networkidle");
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 393;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5);
  });

  test("price and seller info visible on mobile detail page", async ({ page }) => {
    skipIfDesktop(page);
    if (!slug) test.skip();
    await page.goto(`/listings/${slug}`);
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/₱/).first()).toBeVisible({ timeout: 10000 });
    // Scope to main to avoid the hidden "Sellers" nav link in the off-canvas drawer
    await expect(page.locator("main").getByText(/seller/i).first()).toBeVisible({ timeout: 10000 });
  });
});
