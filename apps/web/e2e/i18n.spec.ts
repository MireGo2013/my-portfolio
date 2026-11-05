import { expect, test } from '@playwright/test';

test.describe('браузер на русском', () => {
  test.use({ locale: 'ru-RU' });

  test('адрес без языка ведёт на русскую версию', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/ru$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Владислав Соболь' }),
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
  await page.goto('/ru/experience');
  await expect(page.getByText('ПАО «Банк ВТБ»')).toBeVisible();

  await page.getByRole('link', { name: 'en', exact: true }).click();

  await expect(page).toHaveURL(/\/en\/experience$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByText('VTB Bank')).toBeVisible();

  await page.goto('/');
  await expect(page).toHaveURL(/\/en$/);
});

test.describe('резюме', () => {
  for (const [locale, name, file] of [
    ['ru', 'Посмотреть резюме', 'Sobol_Vladislav_CV_RU.pdf'],
    ['en', 'View resume', 'Sobol_Vladislav_CV_EN.pdf'],
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

test('неизвестная страница показывает 404 на языке адреса', async ({
  page,
}) => {
  const response = await page.goto('/en/no-such-page');

  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Page not found' }),
  ).toBeVisible();
});
