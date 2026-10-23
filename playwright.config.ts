import "dotenv/config";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    },
  },
  reporter: [["list"]],
  webServer: {
    command: "npm run dev -- --port " + (process.env.E2E_PORT ?? "3100"),
    url: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
