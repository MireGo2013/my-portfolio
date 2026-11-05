import { expect, test } from '@playwright/test';
import pg from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://portfolio:portfolio@127.0.0.1:5432/portfolio';
const EMAIL = 'anna@playwright-e2e.example.com';

test('навигация ведёт по всем разделам сайта', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Владислав Соболь' }),
  ).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Основная навигация' });
  for (const [link, heading] of [
    ['Опыт', 'Опыт'],
    ['Проекты', 'Проекты'],
    ['Стек', 'Стек'],
    ['Контакты', 'Контакты'],
  ] as const) {
    await nav.getByRole('link', { name: link }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: heading }),
    ).toBeVisible();
    await expect(nav.getByRole('link', { name: link })).toHaveAttribute(
      'aria-current',
      'page',
    );
  }
});

test.describe('форма контактов', () => {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  const cleanup = () =>
    client.query('DELETE FROM contact_messages WHERE email = $1', [EMAIL]);

  test.beforeAll(async () => {
    await client.connect();
    await cleanup();
  });

  test.afterAll(async () => {
    await cleanup();
    await client.end();
  });

  test('показывает ошибки и не отправляет неверные данные', async ({ page }) => {
    let requests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/contact')) requests += 1;
    });

    await page.goto('/contact');
    await page.getByLabel('Email').fill('не-почта');
    await page.getByRole('button', { name: 'Отправить' }).click();

    await expect(page.getByText('Укажите корректный email')).toBeVisible();
    expect(requests).toBe(0);
  });

  test('сообщение из браузера доходит до базы', async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel('Имя').fill('Анна');
    await page.getByLabel('Email').fill(EMAIL);
    await page.getByLabel('Сообщение').fill('Здравствуйте! Это проверка формы.');
    await page.getByRole('button', { name: 'Отправить' }).click();

    await expect(page.getByRole('status')).toContainText('Сообщение отправлено');
    await expect(page.getByLabel('Имя')).toHaveValue('');

    const { rows } = await client.query(
      'SELECT name, message FROM contact_messages WHERE email = $1',
      [EMAIL],
    );
    expect(rows).toEqual([
      { name: 'Анна', message: 'Здравствуйте! Это проверка формы.' },
    ]);
  });
});
