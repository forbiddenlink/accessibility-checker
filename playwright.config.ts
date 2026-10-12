import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      // CI's software-rendered WebKit can't keep the blur/transition animations
      // stable, so the click actionability check times out (core-journey flaked on
      // main too). Reduced motion is a real user setting the app honours
      // (globals.css), so this tests a supported path, not a workaround.
      use: {
        ...devices["Desktop Safari"],
        contextOptions: { reducedMotion: "reduce" },
      },
    },
  ],
  webServer: {
    // Test the production build, not `next dev`: dev blocks cross-origin
    // HMR from 127.0.0.1, which leaves the page unhydrated and every
    // control disabled. It is also what actually ships.
    command: "pnpm build && pnpm start --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
});
