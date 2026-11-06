import { randomInt, randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import pg from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://portfolio:portfolio@127.0.0.1:5432/portfolio';

export const ADMIN_PASSWORD = 'playwright-admin-password';
// Хеш argon2 для ADMIN_PASSWORD: у сайта нет argon2, поэтому хеш посчитан заранее
const PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$Z2PgXnf3Y6VDRkUr1s7NEA$pr0DYUYqLJYjBJTY/9UCHVPRaPrk7u4xMKoFBZjmdoQ';

export async function withDb<T>(run: (db: pg.Client) => Promise<T>) {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

/**
 * Свой администратор на файл тестов: файлы идут параллельно, и общий
 * пользователь мешал бы им. Сессии удаляются вместе с ним каскадом.
 */
export function setupTestAdmin(email: string) {
  test.beforeAll(async () => {
    await withDb(async (db) => {
      await db.query('DELETE FROM admin_users WHERE email = $1', [email]);
      await db.query(
        `INSERT INTO admin_users (id, email, password_hash, updated_at)
         VALUES ($1, $2, $3, now())`,
        [randomUUID(), email, PASSWORD_HASH],
      );
    });
  });

  test.afterAll(async () => {
    await withDb((db) =>
      db.query('DELETE FROM admin_users WHERE email = $1', [email]),
    );
  });

  // Каждому тесту свой IP посетителя: сайт передаёт его в API вместе с
  // PROXY_SECRET, и лимит попыток входа у тестов не общий. На Vercel этот
  // заголовок выставляет платформа, а здесь его подставляет браузер теста
  test.beforeEach(async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-real-ip': randomIp() });
  });
}

export function randomIp(): string {
  return `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
}

export async function logIn(
  page: Page,
  email: string,
  password = ADMIN_PASSWORD,
) {
  await page.getByLabel('Почта').fill(email);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
}

/** Вход с главной страницы админки до раздела сообщений. */
export async function openAdmin(page: Page, email: string) {
  await page.goto('/admin/login');
  await logIn(page, email);
  await expect(page).toHaveURL(/\/admin\/messages$/);
}
