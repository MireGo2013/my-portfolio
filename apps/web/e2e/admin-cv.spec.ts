import { expect, test } from '@playwright/test';
import {
  expectOnSite,
  openAdmin,
  setupTestAdmin,
  withDb,
} from './admin-helpers';

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

test('загруженное резюме на главной и возврат к файлу из сборки', async ({
  page,
}) => {
  await openAdmin(page, EMAIL);

  // Хранилища в тестах нет, поэтому «загрузку» имитируем: адрес — прямо
  // в базу, а кэш профиля сбрасываем сохранением профиля без изменений
  await withDb((db) =>
    db.query(
      "UPDATE profile_translations SET cv_url = $1 WHERE locale = 'en'",
      [BLOB],
    ),
  );
  const resaved = await page.evaluate(async () => {
    const url = '/admin/api/v1/admin/content/profile';
    const profile: unknown = await fetch(url).then((r) => r.json());
    return fetch(url, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(profile),
    }).then((r) => r.status);
  });
  expect(resaved).toBe(200);

  await expectOnSite(page, '/en', async () => {
    await expect(
      page.getByRole('link', { name: 'View resume' }),
    ).toHaveAttribute('href', BLOB, { timeout: 1000 });
  });
  await expect(
    page.getByRole('link', { name: 'Download resume' }),
  ).toHaveAttribute('href', `${BLOB}?download=1`);

  // Админка видит загруженный файл и умеет вернуть файл из сборки
  await page.goto('/admin/cv');
  const card = page.locator('article').filter({ hasText: 'English version' });
  await expect(card.getByText('Загруженный файл:')).toBeVisible();
  await card.getByRole('button', { name: 'Вернуть файл из сборки' }).click();
  await expect(card.getByRole('status')).toHaveText(
    'Готово. На сайте снова резюме из сборки',
  );

  await expectOnSite(page, '/en', async () => {
    await expect(
      page.getByRole('link', { name: 'View resume' }),
    ).toHaveAttribute('href', '/cv/CV_Sobol_Software_Engineer_EN.pdf', {
      timeout: 1000,
    });
  });
});

test('общий прокси не даёт записать адрес резюме в обход загрузки', async ({
  page,
}) => {
  await openAdmin(page, EMAIL);

  const status = await page.evaluate(
    (url) =>
      fetch('/admin/api/v1/admin/content/cv/en', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url }),
      }).then((r) => r.status),
    BLOB,
  );

  expect(status).toBe(404);
});
