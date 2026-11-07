// Скриншоты для README: сайт и админка на демо-данных.
//
// Нужен запущенный стек: docker compose up --build -d --wait
// Запуск из корня: node apps/web/scripts/readme-screenshots.mjs
//
// Скрипт создаёт временного администратора и демо-сообщения, снимает экраны
// и удаляет всё, что создал. Настоящие сообщения в кадр не попадают: таблица
// снимается с фильтром по сегодняшней дате, а демо-сообщения датированы сегодня.
import { mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import pg from 'pg';

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'http://localhost:3000';
const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://portfolio:portfolio@127.0.0.1:5432/portfolio';
const OUT_DIR = fileURLToPath(
  new URL('../../../.github/assets/readme/', import.meta.url),
);

// Видна в меню админки на скриншотах
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'playwright-admin-password';
// Хеш argon2 для ADMIN_PASSWORD, тот же, что в e2e/admin-helpers.ts
const PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$Z2PgXnf3Y6VDRkUr1s7NEA$pr0DYUYqLJYjBJTY/9UCHVPRaPrk7u4xMKoFBZjmdoQ';

// [имя, почта, текст, статус]
const DEMO_MESSAGES = [
  [
    'Анна Петрова',
    'anna.petrova@example.com',
    'Добрый день! Ищем frontend-разработчика в продуктовую команду. Удобно созвониться на этой неделе?',
    'NEW',
  ],
  [
    'Mark Johnson',
    'mark.johnson@example.com',
    'Hi Vladislav, we are hiring a fullstack engineer (React + NestJS). Would you be open to a chat?',
    'NEW',
  ],
  [
    'Игорь Смирнов',
    'igor.smirnov@example.com',
    'Посмотрел ваш проект с админкой: интересно, как устроена ротация токенов. Можно пару вопросов?',
    'READ',
  ],
  [
    'Ольга Ковалёва',
    'olga.kovaleva@example.com',
    'Спасибо за быстрый ответ, отправила тестовое задание на почту.',
    'REPLIED',
  ],
  [
    'Дмитрий Орлов',
    'd.orlov@example.com',
    'Нужен лендинг для студии, бюджет обсуждаем.',
    'ARCHIVED',
  ],
  [
    'Best SEO Offer',
    'offer@example.com',
    'Increase your traffic 1000% today!!! Click here',
    'SPAM',
  ],
];

const today = new Date();
const isoDate = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0'),
].join('-');

async function withDb(run) {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

async function seedDemo(messageIds) {
  await withDb(async (db) => {
    // Остаток прошлого запуска, если тот упал до уборки
    await db.query('DELETE FROM admin_users WHERE email = $1', [ADMIN_EMAIL]);
    await db.query(
      `INSERT INTO admin_users (id, email, password_hash, updated_at)
       VALUES ($1, $2, $3, now())`,
      [randomUUID(), ADMIN_EMAIL, PASSWORD_HASH],
    );
    // Сегодня, с шагом в 47 минут назад от начала часа: время выглядит живым,
    // а все сообщения остаются в пределах сегодняшнего дня
    const start = new Date(today);
    start.setMinutes(0, 0, 0);
    for (const [
      index,
      [name, email, message, status],
    ] of DEMO_MESSAGES.entries()) {
      const id = randomUUID();
      const createdAt = new Date(start.getTime() - index * 47 * 60_000);
      if (createdAt.getDate() !== today.getDate())
        createdAt.setTime(today.getTime());
      await db.query(
        `INSERT INTO contact_messages (id, name, email, message, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [id, name, email, message, status, createdAt],
      );
      messageIds.push(id);
    }
  });
}

async function cleanup(messageIds) {
  await withDb(async (db) => {
    await db.query('DELETE FROM admin_users WHERE email = $1', [ADMIN_EMAIL]);
    if (messageIds.length > 0) {
      await db.query(
        'DELETE FROM contact_messages WHERE id = ANY($1::uuid[])',
        [messageIds],
      );
    }
  });
}

/** Ждёт загрузку, шрифты и окончание анимаций появления. */
async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
}

async function shot(page, name, options = {}) {
  await settle(page);
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, ...options });
  console.log(`  ${path.relative(process.cwd(), file)}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const messageIds = [];
  const browser = await chromium.launch();
  try {
    await seedDemo(messageIds);

    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      locale: 'ru-RU',
    });
    const page = await desktop.newPage();

    console.log('Сайт:');
    await page.goto(`${BASE_URL}/ru`);
    await shot(page, 'site-home');
    await page.goto(`${BASE_URL}/en/projects`);
    await shot(page, 'site-projects');

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
      locale: 'ru-RU',
    });
    const phone = await mobile.newPage();
    await phone.goto(`${BASE_URL}/ru`);
    await shot(phone, 'site-mobile');
    await mobile.close();

    console.log('Админка:');
    await page.goto(`${BASE_URL}/admin/login`);
    await page.getByLabel('Почта').fill(ADMIN_EMAIL);
    await page.getByLabel('Пароль').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.waitForURL(/\/admin\/messages/);

    await page.goto(`${BASE_URL}/admin/messages?from=${isoDate}`);
    await shot(page, 'admin-messages');

    await page.goto(`${BASE_URL}/admin/messages/${messageIds[0]}`);
    await shot(page, 'admin-message');

    await page.goto(`${BASE_URL}/admin/projects`);
    await settle(page);
    await page
      .locator('main a[href^="/admin/projects/"]:not([href$="/new"])')
      .first()
      .click();
    await page.waitForURL(/\/admin\/projects\/[^/]+$/);
    await shot(page, 'admin-project');

    // Шаг подключения второго фактора с QR-кодом. Секрет принадлежит
    // временному администратору и удаляется вместе с ним
    await page.goto(`${BASE_URL}/admin/security`);
    await settle(page);
    await page.getByRole('button', { name: 'Подключить' }).click();
    const qr = page.getByAltText('QR-код для приложения-аутентификатора');
    await qr.waitFor();
    // Размываем и ключ, и QR: в QR зашифрован тот же секрет. Он и так
    // одноразовый, но на скриншоте не должен выглядеть как утечка
    const manualKey = page
      .locator('code')
      .filter({ hasText: /^[A-Z2-7]{16,}$/ });
    for (const target of [qr, manualKey]) {
      await target.evaluate((el) => {
        el.style.filter = 'blur(6px)';
      });
    }
    await shot(page, 'admin-security');

    await desktop.close();
  } finally {
    await browser.close();
    await cleanup(messageIds);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
