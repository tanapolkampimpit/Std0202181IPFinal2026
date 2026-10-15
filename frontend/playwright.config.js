import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: { baseURL: 'http://localhost:8081', viewport: { width: 375, height: 812 }, trace: 'retain-on-failure' },
  webServer: [
    { command: 'npm --prefix ../backend start', url: `${process.env.TNPKHR_TEST_API_URL ?? 'http://localhost:3000'}/api/health`, reuseExistingServer: !process.env.CI, timeout: 30000 },
    { command: 'npx expo start --port 8081', url: 'http://localhost:8081', reuseExistingServer: !process.env.CI, timeout: 120000, env: { EXPO_PUBLIC_API_URL: process.env.TNPKHR_TEST_API_URL ?? 'http://localhost:3000', CI: '1' } },
  ],
});
