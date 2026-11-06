import { expect, test } from '@playwright/test';
import { openAdmin, setupTestAdmin, withDb } from './admin-helpers';

const EMAIL = 'admin@playwright-cv.example.com';
const BLOB = 'https://pwcv.public.blob.vercel-storage.com/cv/pw-en.pdf';

setupTestAdmin(EMAIL);

// Общая база: тест не должен оставить чужой адрес резюме для тестов сайта
test.afterAll(async () => {
  await withDb((db) =>
    db.query(
      'UPDATE profile_translations SET cv_url = NULL WHERE cv_url = $1',
      [BLOB],
    ),
  );
});

test('без хранилища загрузка объясняет, что Blob не подключён', async ({
  page,
}) => {
  await openAdmin(page, EMAIL);
  await page.goto('/admin/cv');

  const card = page.locator('article').filter({ hasText: 'Русская версия' });
  await expect(card.getByText('Файл из сборки сайта:')).toBeVisible();

  await card.getByLabel('Новый PDF').setInputFiles({
    name: 'cv.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7\n%test'),
  });
  await card.getByRole('button', { name: 'Загрузить' }).click();

  await expect(card.getByRole('alert')).toContainText(
    'Хранилище Vercel Blob не подключено',
  );
});

test('адрес резюме из админки сразу появляется на главной', async ({
  page,
}) => {
  await openAdmin(page, EMAIL);

  // Хранилища в тестах нет, поэтому адрес ставим прямо через API админки:
  // так проверяется путь «API → сброс кэша → страница сайта»
  const put = await page.evaluate(
    (url) =>
      fetch('/admin/api/v1/admin/content/cv/en', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      }).then((r) => r.status),
    BLOB,
  );
  expect(put).toBe(200);

  await page.goto('/en');
  await expect(page.getByRole('link', { name: 'View resume' })).toHaveAttribute(
    'href',
    BLOB,
  );
  await expect(
    page.getByRole('link', { name: 'Download resume' }),
  ).toHaveAttribute('href', `${BLOB}?download=1`);

  // Вернули резюме из сборки — и на сайте снова оно
  const removed = await page.evaluate(() =>
    fetch('/admin/api/v1/admin/content/cv/en', { method: 'DELETE' }).then(
      (r) => r.status,
    ),
  );
  expect(removed).toBe(200);
  await page.goto('/en');
  await expect(page.getByRole('link', { name: 'View resume' })).toHaveAttribute(
    'href',
    '/cv/Sobol_Vladislav_CV_EN.pdf',
  );
});
