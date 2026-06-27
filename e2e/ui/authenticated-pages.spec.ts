/**
 * UI E2E — authenticated app pages.
 *
 * Auth state is pre-loaded from e2e/.auth/buyer.json (saved by auth.setup.ts),
 * so tests start already logged in — no per-test login calls.
 */
import { test, expect } from "@playwright/test";
import { BUYER_AUTH, SELLER_AUTH } from "../helpers/auth-paths";

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard (buyer)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Dashboard (buyer)", () => {
  test.use({ storageState: BUYER_AUTH });

  test("renders and shows nav links", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
    const vw = page.viewportSize()?.width ?? 1280;
    if (vw > 768) {
      // Desktop: nav links are visible in the header
      await expect(page.locator("a[href='/marketplace']").first()).toBeVisible();
    } else {
      // Mobile: nav links are in the drawer — just verify hamburger exists
      await expect(page.locator("button[aria-label='Open menu']")).toBeVisible();
    }
  });

  test("header contains user avatar or menu", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Look inside the sticky header only to avoid the hidden off-canvas drawer button
    const header = page.locator("header").first();
    const menu = header.locator(
      "[aria-label*='user' i], [aria-label*='account' i], [aria-label*='profile' i], img[alt]",
    ).first();
    await expect(menu).toBeVisible({ timeout: 8000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// My Listings (seller)
// ─────────────────────────────────────────────────────────────────────────────
test.describe("My Listings (seller)", () => {
  test.use({ storageState: SELLER_AUTH });

  test("listings page loads", async ({ page }) => {
    await page.goto("/listings");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/listings/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("new listing page renders form", async ({ page }) => {
    await page.goto("/listings/new");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("input, form").first()).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// App pages (buyer)
// ─────────────────────────────────────────────────────────────────────────────
const APP_PAGES = [
  { path: "/collection",   label: "Collection"   },
  { path: "/wishlist",     label: "Wishlist"      },
  { path: "/messages",     label: "Messages"      },
  { path: "/transactions", label: "Transactions"  },
  { path: "/offers",       label: "Offers"        },
  { path: "/bids",         label: "Bids"          },
  { path: "/notifications",label: "Notifications" },
  { path: "/settings",     label: "Settings"      },
];

test.describe("App pages load correctly (buyer)", () => {
  test.use({ storageState: BUYER_AUTH });

  for (const { path, label } of APP_PAGES) {
    test(`${label} (${path}) renders without error`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(new RegExp(path.slice(1)));
      await expect(page.locator("body")).toBeVisible();
      // No "Internal Server Error" text
      await expect(page.getByText(/internal server error/i)).not.toBeVisible();
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Unauthenticated redirect guard
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Protected routes redirect to login when unauthenticated", () => {
  // Use empty storageState so we start without a session
  test.use({ storageState: { cookies: [], origins: [{ origin: "http://localhost:3000", localStorage: [{ name: "tcgmarket_mvp_dismissed", value: "1" }] }] } });

  const PROTECTED = [
    "/dashboard",
    "/listings",
    "/collection",
    "/wishlist",
    "/messages",
    "/transactions",
    "/offers",
    "/bids",
    "/notifications",
    "/settings",
  ];

  for (const path of PROTECTED) {
    test(`${path} → redirects to login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/login|signin/, { timeout: 10000 });
      await expect(page).toHaveURL(/login|signin/);
    });
  }
});
