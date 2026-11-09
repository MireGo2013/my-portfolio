import { expect, test } from '@playwright/test';

test.describe('браузер на русском', () => {
  test.use({ locale: 'ru-RU' });

  test('адрес без языка ведёт на русскую версию', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/ru$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Влад' }),
    ).toBeVisible();
  });
});

test.describe('браузер на другом языке', () => {
  test.use({ locale: 'de-DE' });

  test('получает английскую версию', async ({ page }) => {
    await page.goto('/skills');

    await expect(page).toHaveURL(/\/en\/skills$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Skills' }),
    ).toBeVisible();
  });
});

test('переключатель сохраняет страницу и запоминает выбор', async ({
  page,
}) => {
  await page.goto('/ru/projects');
  await expect(page.getByText('ПАО «Банк ВТБ»')).toBeVisible();

  await page.getByRole('link', { name: 'en', exact: true }).click();

  await expect(page).toHaveURL(/\/en\/projects$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('VTB Bank')).toBeVisible();

  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
});

test.describe('резюме', () => {
  for (const [locale, name, file] of [
    ['ru', 'Посмотреть резюме', 'CV_Sobol_Software_Engineer_RU.pdf'],
    ['en', 'View resume', 'CV_Sobol_Software_Engineer_EN.pdf'],
  ] as const) {
    test(`на языке ${locale} ведёт на свой PDF`, async ({ page, request }) => {
      await page.goto(`/${locale}`);

      const href = await page.getByRole('link', { name }).getAttribute('href');
      expect(href).toBe(`/cv/${file}`);

      const response = await request.get(`/cv/${file}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/pdf');
    });
  }
});

test('переключатель сохраняет параметры адреса и якорь', async ({ page }) => {
  await page.goto('/ru/contact?utm_source=test#form');

  await page.getByRole('link', { name: 'en', exact: true }).click();

  await expect(page).toHaveURL(/\/en\/contact\?utm_source=test#form$/);
});

test('заголовок вкладки содержит имя', async ({ page }) => {
  await page.goto('/en/skills');

  await expect(page).toHaveTitle('Skills | Vladislav Sobol');
});

for (const path of ['/favicon.ico', '/robots.txt', '/ru/foo.bar']) {
  test(`несуществующий файл ${path} показывает оформленную 404`, async ({
    page,
  }) => {
    const response = await page.goto(path);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}

test('страница 404 не объявляет главную каноническим адресом', async ({
  page,
}) => {
  await page.goto('/en/no-such-page');

  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test.describe('страница 404 без JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('приходит с готовым текстом и меню', async ({ page }) => {
    const response = await page.goto('/ru/nope');

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Страница не найдена' }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Основная навигация' }),
    ).toBeVisible();
  });
});

test('вложенный адрес в существующем разделе тоже 404', async ({ page }) => {
  const response = await page.goto('/en/skills/extra');

  expect(response?.status()).toBe(404);
});

test('неизвестная страница показывает 404 на языке адреса', async ({
  page,
}) => {
  const response = await page.goto('/en/no-such-page');

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeVisible();
});
