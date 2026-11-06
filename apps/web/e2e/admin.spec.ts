import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import pg from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://portfolio:portfolio@127.0.0.1:5432/portfolio';
const EMAIL = 'admin@playwright-e2e.example.com';
const PASSWORD = 'playwright-admin-password';
// Хеш argon2 для PASSWORD: у сайта нет argon2, поэтому хеш посчитан заранее
const PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$Z2PgXnf3Y6VDRkUr1s7NEA$pr0DYUYqLJYjBJTY/9UCHVPRaPrk7u4xMKoFBZjmdoQ';

async function withDb(run: (client: pg.Client) => Promise<void>) {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await run(client);
  } finally {
    await client.end();
  }
}

test.beforeAll(async () => {
  await withDb(async (db) => {
    await db.query('DELETE FROM admin_users WHERE email = $1', [EMAIL]);
    await db.query(
      `INSERT INTO admin_users (id, email, password_hash, updated_at)
       VALUES ($1, $2, $3, now())`,
      [randomUUID(), EMAIL, PASSWORD_HASH],
    );
  });
});

test.afterAll(async () => {
  // Сессии удалятся каскадом
  await withDb((db) =>
    db
      .query('DELETE FROM admin_users WHERE email = $1', [EMAIL])
      .then(() => undefined),
  );
});

// Каждому тесту свой IP посетителя: сайт передаёт его в API вместе с
// PROXY_SECRET, и лимит попыток входа у тестов не общий. На Vercel этот
// заголовок выставляет платформа, а здесь его подставляет браузер теста
let ipCounter = 0;
test.beforeEach(async ({ page }) => {
  ipCounter += 1;
  await page.setExtraHTTPHeaders({
    'x-real-ip': `198.51.100.${(Date.now() + ipCounter) % 250}`,
  });
});

// У Next.js на странице есть свой role="alert" для объявлений о переходах
const formAlert = (page: Page) => page.locator('form').getByRole('alert');

async function logIn(page: Page, password = PASSWORD) {
  await page.getByLabel('Почта').fill(EMAIL);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
}

test('без входа страница админки ведёт на вход и возвращает обратно', async ({
  page,
}) => {
  await page.goto('/admin/profile');

  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fprofile$/);

  await logIn(page);

  await expect(page).toHaveURL(/\/admin\/profile$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Профиль' }),
  ).toBeVisible();
  await expect(page.getByText(EMAIL)).toBeVisible();
});

test('неверный пароль показывает ошибку', async ({ page }) => {
  await page.goto('/admin/login');

  await logIn(page, 'wrong-password');

  await expect(formAlert(page)).toHaveText('Неверная почта или пароль');
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test('меню переключает разделы', async ({ page }) => {
  await page.goto('/admin/login');
  await logIn(page);
  await expect(page).toHaveURL(/\/admin\/messages$/);

  const nav = page.getByRole('navigation', { name: 'Разделы админки' });
  await nav.getByRole('link', { name: 'Стек' }).click();

  await expect(
    page.getByRole('heading', { level: 1, name: 'Стек' }),
  ).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Стек' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('истёкший токен доступа обновляется сам', async ({ page, context }) => {
  await page.goto('/admin/login');
  await logIn(page);
  await expect(page).toHaveURL(/\/admin\/messages$/);
  const before = await context.cookies();

  // Так браузер ведёт себя через 15 минут: cookie доступа исчезает
  await context.clearCookies({ name: 'admin_access' });
  await page.goto('/admin/skills');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Стек' }),
  ).toBeVisible();
  const after = await context.cookies();
  const value = (cookies: typeof after, name: string) =>
    cookies.find((cookie) => cookie.name === name)?.value;
  expect(value(after, 'admin_access')).toBeTruthy();
  expect(value(after, 'admin_refresh')).not.toBe(
    value(before, 'admin_refresh'),
  );
});

test('выход завершает сессию', async ({ page }) => {
  await page.goto('/admin/login');
  await logIn(page);
  await expect(page).toHaveURL(/\/admin\/messages$/);

  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);

  await page.goto('/admin/messages');
  await expect(page).toHaveURL(/\/admin\/login/);
});

test('чужой лимит попыток не блокирует вход автору', async ({ page }) => {
  await page.goto('/admin/login');
  for (let i = 0; i < 5; i += 1) {
    await logIn(page, 'wrong-password');
    await expect(formAlert(page)).toHaveText('Неверная почта или пароль');
  }
  await logIn(page, 'wrong-password');
  await expect(formAlert(page)).toHaveText(
    'Слишком много попыток. Подождите 15 минут',
  );

  // Автор приходит с другого адреса
  await page.setExtraHTTPHeaders({ 'x-real-ip': '192.0.2.77' });
  await logIn(page);

  await expect(page).toHaveURL(/\/admin\/messages$/);
});

test('админка закрыта от поиска, а прокси пускает только к её API', async ({
  request,
}) => {
  const login = await request.get('/admin/login');
  expect(login.headers()['x-robots-tag']).toBe('noindex, nofollow');
  expect(await login.text()).toContain('noindex');

  const health = await request.get('/admin/api/v1/health');
  expect(health.status()).toBe(404);
});
