import { expect, test, type Page } from '@playwright/test';
import pg from 'pg';

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://portfolio:portfolio@127.0.0.1:5432/portfolio';
const EMAIL = 'anna@playwright-e2e.example.com';

test('навигация ведёт по всем разделам сайта', async ({ page }) => {
  await page.goto('/ru/contact');

  const nav = page.getByRole('navigation', { name: 'Основная навигация' });
  for (const [link, heading] of [
    ['Обо мне', 'Влад'],
    ['Работа', 'Работа'],
    ['Опыт', 'Опыт'],
    ['Навыки', 'Навыки'],
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

test('главная показывает историю, ленту навыков и ссылки', async ({ page }) => {
  await page.goto('/en');

  await expect(page.getByText('Hi, my name is')).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 1, name: 'Vlad' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Skills and tools' })
      .getByText('NestJS')
      .first(),
  ).toBeVisible();

  const links = page.getByRole('navigation', { name: 'Profile links' });
  await expect(links.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/vlad-sobol-59458b214/',
  );
});

test.describe('лента навыков', () => {
  const track = '.marquee-track';
  const animation = (page: Page) =>
    page
      .locator(track)
      .evaluate((element) => getComputedStyle(element).animationName);

  test('движется и останавливается при наведении', async ({ page }) => {
    await page.goto('/ru');
    expect(await animation(page)).toBe('marquee');

    await page.locator('.marquee').hover();

    await expect(page.locator(track)).toHaveCSS(
      'animation-play-state',
      'paused',
    );
  });

  test.describe('при просьбе убрать анимацию', () => {
    test.use({ reducedMotion: 'reduce' });

    test('стоит на месте и не показывает копию', async ({ page }) => {
      await page.goto('/ru');

      expect(await animation(page)).toBe('none');
      await expect(page.locator('.marquee-copy')).toBeHidden();
    });
  });
});

test('разделы содержат нужный контент', async ({ page }) => {
  await page.goto('/ru/work');
  await expect(page.getByText('ПАО «Банк ВТБ»')).toBeVisible();
  await expect(
    page
      .getByRole('heading', { name: 'Задачи и зона ответственности' })
      .first(),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Фриланс' })).toBeVisible();
  await expect(page.getByText('Детский центр «Сова»')).toBeVisible();

  await page.goto('/ru/experience');
  await expect(page.getByText('Paint Online')).toBeVisible();
  await expect(page.getByText('Детский центр «Сова»')).toHaveCount(0);
});

test('старый адрес проектов ведёт в новый раздел', async ({ page }) => {
  await page.goto('/ru/projects');

  await expect(page).toHaveURL(/\/ru\/experience$/);
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

  test('показывает ошибки и не отправляет неверные данные', async ({
    page,
  }) => {
    let requests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/contact')) requests += 1;
    });

    await page.goto('/ru/contact');
    await page.getByLabel('Email').fill('не-почта');
    await page.getByRole('button', { name: 'Отправить' }).click();

    await expect(page.getByText('Укажите корректный email')).toBeVisible();
    expect(requests).toBe(0);
  });

  test('сообщение из браузера доходит до базы', async ({ page }) => {
    await page.goto('/ru/contact');
    await page.getByLabel('Имя').fill('Анна');
    await page.getByLabel('Email').fill(EMAIL);
    await page
      .getByLabel('Сообщение')
      .fill('Здравствуйте! Это проверка формы.');
    await page.getByRole('button', { name: 'Отправить' }).click();

    await expect(page.getByRole('status')).toContainText(
      'Сообщение отправлено',
    );
    await expect(page.getByLabel('Имя')).toHaveValue('');

    const { rows } = await client.query(
      'SELECT name, message FROM contact_messages WHERE email = $1',
      [EMAIL],
    );
    expect(rows).toEqual([
      { name: 'Анна', message: 'Здравствуйте! Это проверка формы.' },
    ]);
  });

  test('ошибки на английской версии показаны на английском', async ({
    page,
  }) => {
    await page.goto('/en/contact');
    await page.getByLabel('Email').fill('not-an-email');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText('Enter a valid email')).toBeVisible();
  });
});
