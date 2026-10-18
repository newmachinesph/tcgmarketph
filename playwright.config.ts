import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,     // sequential so DB state is predictable
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: { accept: "application/json" },
    trace: "retain-on-failure",
    // Pre-dismiss the MVP banner modal so it doesn't block UI tests
    storageState: {
      cookies: [],
      origins: [{
        origin: "http://localhost:3000",
        localStorage: [{ name: "tcgmarket_mvp_dismissed", value: "1" }],
      }],
    },
  },

  projects: [
    // API tests — no browser, no auth setup needed
    {
      name: "api",
      testMatch: "e2e/api/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },

    // Auth setup — runs once, saves session state to files
    {
      name: "setup",
      testMatch: "e2e/auth.setup.ts",
      use: { ...devices["Desktop Chrome"] },
    },

    // UI tests — Chromium, depends on setup for auth state
    {
      name: "ui",
      testMatch: "e2e/ui/**/*.spec.ts",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
    },

    // Mobile UI
    {
      name: "mobile",
      testMatch: "e2e/ui/**/*.spec.ts",
      dependencies: ["setup"],
      use: { ...devices["Pixel 5"] },
    },
  ],

  // Start dev server if not already running; reuse if it is.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
