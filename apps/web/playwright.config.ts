import { defineConfig, devices } from '@playwright/test';

const API_URL = 'http://127.0.0.1:3001';
const WEB_URL = 'http://127.0.0.1:3000';
// Тестовый секрет: с ним API верит IP посетителя, который передаёт сайт.
// Если серверы уже запущены (reuseExistingServer), у них должен быть тот же
const PROXY_SECRET = process.env.PROXY_SECRET ?? 'playwright-proxy-secret';
const CONTENT_MUTATING = /admin-(content|cv)\.spec\.ts$/;

// Нужны база с миграциями и seed и собранный API: pnpm db:up, pnpm db:seed, pnpm build:deps
export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? WEB_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: CONTENT_MUTATING,
    },
    // Эти тесты меняют общий публичный контент (проекты, стек, резюме).
    // Параллельно с тестами сайта они видели бы чужие правки и сами мешали бы
    // им, поэтому идут отдельным проектом после всех остальных
    {
      name: 'content-mutating',
      use: { ...devices['Desktop Chrome'] },
      testMatch: CONTENT_MUTATING,
      dependencies: ['chromium'],
      // И друг с другом по очереди: два почти одновременных сброса меток
      // одной страницы (projects и profile) могут оставить её устаревшей
      workers: 1,
    },
  ],
  webServer: [
    {
      command: 'node dist/main.js',
      cwd: '../api',
      url: `${API_URL}/api/v1/health`,
      reuseExistingServer: true,
      env: {
        CORS_ORIGIN: WEB_URL,
        PROXY_SECRET,
        // Тесты не должны слать настоящие уведомления
        TELEGRAM_BOT_TOKEN: '',
        TELEGRAM_CHAT_ID: '',
      },
    },
    {
      command: 'pnpm dev --hostname 127.0.0.1',
      url: WEB_URL,
      reuseExistingServer: true,
      timeout: 120_000,
      // x-real-ip тестам задаёт браузер. В проде его выставляет Vercel
      env: {
        API_URL,
        NEXT_PUBLIC_API_URL: API_URL,
        PROXY_SECRET,
        TRUST_X_REAL_IP: 'true',
      },
    },
  ],
});
