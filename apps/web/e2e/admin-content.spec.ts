import { expect, test, type Page } from '@playwright/test';
import {
  expectOnSite,
  openAdmin,
  setupTestAdmin,
  withDb,
} from './admin-helpers';

const EMAIL = 'admin@playwright-content.example.com';
// Записи теста помечены slug: их удаляем после тестов, даже если тест упал
const MARK = 'pw-content';

setupTestAdmin(EMAIL);

test.afterAll(async () => {
  await withDb(async (db) => {
    await db.query('DELETE FROM projects WHERE slug LIKE $1', [`${MARK}%`]);
    await db.query('DELETE FROM work WHERE slug LIKE $1', [`${MARK}%`]);
    await db.query('DELETE FROM skill_categories WHERE slug LIKE $1', [
      `${MARK}%`,
    ]);
  });
});

/** Поле перевода: у каждого языка своя рамка с подписью. */
const inLocale = (page: Page, locale: 'Русский' | 'English') =>
  page.getByRole('group', { name: locale });

async function save(page: Page) {
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByRole('status')).toHaveText(/^Сохранено/);
}

test('профиль загружается в форму и сохраняется', async ({ page }) => {
  await openAdmin(page, EMAIL);
  await page.goto('/admin/profile');

  await expect(
    inLocale(page, 'Русский').getByLabel('Короткое имя'),
  ).toHaveValue('Влад');
  await expect(
    inLocale(page, 'English').getByLabel('Короткое имя'),
  ).toHaveValue('Vlad');

  // Без изменений: профиль общий с тестами сайта, которые идут параллельно
  await save(page);
});

test('открытый проект: создание, правка и удаление видны на сайте', async ({
  page,
}) => {
  const slug = `${MARK}-project`;
  await openAdmin(page, EMAIL);
  await page.goto('/admin/experience/new');

  // Пустая форма не уходит на сервер
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Проверьте' }),
  ).toBeVisible();
  await expect(page.getByText('Заполните поле').first()).toBeVisible();

  await page.getByLabel('Адрес (slug)').fill(slug);
  await page.getByLabel('Стек').fill('Playwright\nTypeScript');
  await page.getByLabel('Код').fill('https://github.com/example/pw');
  await inLocale(page, 'Русский').getByLabel('Название').fill('Проект PW');
  await inLocale(page, 'Русский').getByLabel('Описание').fill('Описание');
  await inLocale(page, 'English').getByLabel('Название').fill('Project PW');
  await inLocale(page, 'English').getByLabel('Описание').fill('Description');
  await save(page);

  // Новая запись открывается по своему адресу
  await expect(page).toHaveURL(/\/admin\/experience\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Проект PW');

  const editUrl = page.url();
  await expectOnSite(page, '/en/experience', () =>
    expect(page.getByText('Project PW')).toBeVisible({ timeout: 1000 }),
  );

  // Правка
  await page.goto(editUrl);
  await inLocale(page, 'English').getByLabel('Название').fill('Project PW v2');
  await save(page);
  await expectOnSite(page, '/en/experience', () =>
    expect(page.getByText('Project PW v2')).toBeVisible({ timeout: 1000 }),
  );

  // Удаление из списка в два шага
  await page.goto('/admin/experience');
  await page.getByRole('button', { name: 'Удалить: Проект PW' }).click();
  await page.getByRole('button', { name: 'Да, удалить' }).click();
  await expect(page.getByRole('link', { name: 'Проект PW' })).toHaveCount(0);

  await expectOnSite(page, '/en/experience', () =>
    expect(page.getByText('Project PW v2')).toHaveCount(0, { timeout: 1000 }),
  );
});

test('занятый slug подсвечивает поле', async ({ page }) => {
  await openAdmin(page, EMAIL);
  await page.goto('/admin/skills/new');

  // frontend уже есть в seed
  const { rows } = await withDb((db) =>
    db.query<{ slug: string }>(
      'SELECT slug FROM skill_categories ORDER BY position LIMIT 1',
    ),
  );
  await page.getByLabel('Адрес (slug)').fill(rows[0]?.slug ?? 'languages');
  await inLocale(page, 'Русский').getByLabel('Название группы').fill('Дубль');
  await inLocale(page, 'English')
    .getByLabel('Название группы')
    .fill('Duplicate');
  await page.getByLabel('Навыки').fill('Vitest');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByText('Такой адрес уже занят')).toBeVisible();
});

test('группа навыков появляется на странице стека', async ({ page }) => {
  await openAdmin(page, EMAIL);
  await page.goto('/admin/skills/new');

  await page.getByLabel('Адрес (slug)').fill(`${MARK}-skills`);
  await inLocale(page, 'Русский')
    .getByLabel('Название группы')
    .fill('Тесты PW');
  await inLocale(page, 'English')
    .getByLabel('Название группы')
    .fill('PW Testing');
  await page.getByLabel('Навыки').fill('Playwright\n\nVitest\n');
  await save(page);

  // Группа — термин списка определений, навыки — его описание
  const group = page.getByRole('term').filter({ hasText: 'PW Testing' });
  await expectOnSite(page, '/en/skills', () =>
    expect(group).toBeVisible({ timeout: 1000 }),
  );
  await expect(group.locator('xpath=following-sibling::dd')).toContainText(
    'Playwright',
  );
});
