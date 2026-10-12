import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL || "";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 4,
  use: { baseURL: externalBaseUrl || "http://127.0.0.1:4173" },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "node scripts/aivic-build.mjs && node scripts/aivic-test-server.mjs",
        url: "http://127.0.0.1:4173/__aivic_test__/health",
        reuseExistingServer: false,
        timeout: 300000,
      },
  reporter: "list",
});
