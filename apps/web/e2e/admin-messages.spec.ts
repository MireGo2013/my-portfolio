import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { openAdmin, setupTestAdmin, withDb } from './admin-helpers';

const EMAIL = 'admin@playwright-messages.example.com';
// Сообщения теста помечены доменом, по нему же поиск в таблице:
// другие сообщения в базе не мешают
const MARK = 'pw-messages';
const DOMAIN = `@${MARK}.example.com`;

setupTestAdmin(EMAIL);

test.beforeEach(async () => {
  await withDb(async (db) => {
    await db.query('DELETE FROM contact_messages WHERE email LIKE $1', [
      `%${DOMAIN}`,
    ]);
    for (const [name, status, day] of [
      ['Анна', 'NEW', '2026-10-01'],
      ['Борис', 'READ', '2026-10-02'],
      ['Вера', 'NEW', '2026-10-03'],
    ] as const) {
      await db.query(
        `INSERT INTO contact_messages
           (id, name, email, message, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [
          randomUUID(),
          name,
          `${name.toLowerCase()}${DOMAIN}`,
          `Здравствуйте, это ${name}`,
          status,
          `${day}T12:00:00Z`,
        ],
      );
    }
  });
});

test.afterAll(async () => {
  await withDb((db) =>
    db.query('DELETE FROM contact_messages WHERE email LIKE $1', [
      `%${DOMAIN}`,
    ]),
  );
});

const table = (page: Page) => page.getByRole('table');
const rowNames = (page: Page) =>
  table(page).locator('tbody tr td:nth-child(2)');

async function searchMarked(page: Page) {
  await page.getByLabel('Поиск').fill(MARK);
  await expect(page).toHaveURL(new RegExp(`q=${MARK}`));
  await expect(rowNames(page)).toHaveText(['Вера', 'Борис', 'Анна']);
}

test('фильтры живут в адресе и переживают «Назад»', async ({ page }) => {
  await openAdmin(page, EMAIL);
  await searchMarked(page);

  await page.getByRole('button', { name: /^Новые/ }).click();
  await expect(page).toHaveURL(/status=NEW/);
  await expect(rowNames(page)).toHaveText(['Вера', 'Анна']);

  await table(page).getByRole('button', { name: /Имя/ }).click();
  await expect(page).toHaveURL(/sort=name&order=asc/);
  await expect(rowNames(page)).toHaveText(['Анна', 'Вера']);

  await page.goBack();
  await expect(rowNames(page)).toHaveText(['Вера', 'Анна']);

  // Ссылку на выборку можно открыть заново
  await page.reload();
  await expect(rowNames(page)).toHaveText(['Вера', 'Анна']);
  await expect(page.getByRole('button', { name: /^Новые/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('карточка отмечает прочитанным и меняет статус', async ({ page }) => {
  await openAdmin(page, EMAIL);
  await expect(
    page
      .getByRole('navigation', { name: 'Разделы админки' })
      .getByLabel(/^новых: \d+$/),
  ).toBeVisible();
  await searchMarked(page);

  await table(page).getByRole('link', { name: 'Анна' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Анна' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Прочитано' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('link', { name: 'Ответить письмом' }),
  ).toHaveAttribute('href', /^mailto:анна@pw-messages\.example\.com\?/);

  await page.getByRole('button', { name: 'Спам' }).click();
  await expect(page.getByRole('button', { name: 'Спам' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Возврат к списку с теми же фильтрами, и статус уже новый
  await page.getByRole('link', { name: '← К списку' }).click();
  await expect(page).toHaveURL(new RegExp(`q=${MARK}`));
  await page.getByRole('button', { name: /^Спам/ }).click();
  await expect(rowNames(page)).toHaveText(['Анна']);

  const status = await withDb(async (db) => {
    const { rows } = await db.query<{ status: string }>(
      'SELECT status FROM contact_messages WHERE email = $1',
      [`анна${DOMAIN}`],
    );
    return rows[0]?.status;
  });
  expect(status).toBe('SPAM');
});
