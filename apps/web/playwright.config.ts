import { defineConfig, devices } from '@playwright/test';

const API_URL = 'http://127.0.0.1:3001';
const WEB_URL = 'http://127.0.0.1:3000';

// Нужны база с миграциями и seed и собранный API: pnpm db:up, pnpm db:seed, pnpm build:deps
export default defineConfig({
  testDir: './e2e',
  use: { baseURL: WEB_URL, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node dist/main.js',
      cwd: '../api',
      url: `${API_URL}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        CORS_ORIGIN: WEB_URL,
        // Тесты не должны слать настоящие уведомления
        TELEGRAM_BOT_TOKEN: '',
        TELEGRAM_CHAT_ID: '',
      },
    },
    {
      command: 'pnpm dev --hostname 127.0.0.1',
      url: WEB_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { API_URL, NEXT_PUBLIC_API_URL: API_URL },
    },
  ],
});
