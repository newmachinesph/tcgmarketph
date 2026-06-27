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
  },

  projects: [
    // API tests — headless, no browser needed
    {
      name: "api",
      testMatch: "e2e/api/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    // UI tests — Chromium
    {
      name: "ui",
      testMatch: "e2e/ui/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    // Mobile UI
    {
      name: "mobile",
      testMatch: "e2e/ui/**/*.spec.ts",
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
