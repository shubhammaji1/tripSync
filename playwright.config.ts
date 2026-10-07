import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined, screenshot: 'only-on-failure' },
  webServer: { command: 'node tests/browser/server.cjs', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI, timeout: 60000 },
});
