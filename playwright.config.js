import path from "path";
import { defineConfig, devices } from "@playwright/test";

const runId =
  process.env.PLAYWRIGHT_RUN_ID ||
  new Date().toISOString().replace(/[:.]/g, "-");
const artifactsRoot = path.join(
  process.cwd(),
  "artifacts",
  "playwright",
  runId
);
const screenshotMode =
  process.env.PLAYWRIGHT_CAPTURE === "verbose"
    ? "on"
    : "only-on-failure";
const videoMode =
  process.env.PLAYWRIGHT_CAPTURE === "verbose"
    ? "on"
    : "retain-on-failure";
const traceMode = process.env.CI ? "on" : "retain-on-failure";
const nextAuthSecret =
  process.env.NEXTAUTH_SECRET || "test-secret-key-for-testing-only";
const nextAuthTestToken =
  process.env.NEXTAUTH_TEST_TOKEN || "nextauth-test-token";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    [
      "html",
      { outputFolder: path.join(artifactsRoot, "html"), open: "never" },
    ],
  ],
  outputDir: path.join(artifactsRoot, "results"),

  use: {
    baseURL: "http://localhost:3000",
    trace: traceMode,
    screenshot: screenshotMode,
    video: videoMode,
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
      use: { ...devices["Desktop Safari"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: "test",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: nextAuthSecret,
      NEXTAUTH_TEST_TOKEN: nextAuthTestToken,
    },
  },
});
