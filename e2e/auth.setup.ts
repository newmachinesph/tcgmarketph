/**
 * Auth setup — runs once before UI test projects.
 * Signs in as buyer + seller and saves browser storage state to files so
 * that authenticated UI tests don't need to re-login on every test.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { BUYER_AUTH, SELLER_AUTH } from "./helpers/auth-paths";

const AUTH_DIR = path.join(process.cwd(), "e2e/.auth");

setup.beforeAll(() => {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
});

setup("save buyer auth state", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /email/i }).fill("marco@test.com");
  await page.getByRole("textbox", { name: /password/i }).fill(process.env.SEED_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|profile-setup)/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/(dashboard|profile-setup)/);
  await page.context().storageState({ path: BUYER_AUTH });
});

setup("save seller auth state", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /email/i }).fill("joven@test.com");
  await page.getByRole("textbox", { name: /password/i }).fill(process.env.SEED_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/(dashboard|profile-setup)/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/(dashboard|profile-setup)/);
  await page.context().storageState({ path: SELLER_AUTH });
});
