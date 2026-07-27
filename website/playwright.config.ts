import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CI = process.env.CI === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: path.join(__dirname, "tests/e2e/global-setup.ts"),
  timeout: 45000,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "tests/results.json" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:4321",
    headless: CI,
    screenshot: "on",
    video: CI ? "off" : "retain-on-failure",
    slowMo: CI ? 0 : 80,
    viewport: { width: 1440, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: "/usr/bin/chromium",
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        },
      },
    },
  ],
});
