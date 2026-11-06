import { createHmac } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { logIn, openAdmin, setupTestAdmin } from './admin-helpers';

const EMAIL = 'admin@playwright-security.example.com';

setupTestAdmin(EMAIL);

// Тест считает коды сам, как приложение на телефоне: RFC 6238, SHA-1, 30 с
function base32Decode(text: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of text) {
    value = (value << 5) | alphabet.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totp(secret: string, shift = 0): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000) + shift));
  const hmac = createHmac('sha1', base32Decode(secret))
    .update(counter)
    .digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(
    6,
    '0',
  );
}

async function logOut(page: Page) {
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
}

// Шаги зависят друг от друга: включили — входим с кодом — выключаем
test.describe.configure({ mode: 'serial' });

let secret = '';
let backupCodes: string[] = [];

test('подключение второго фактора по QR-коду', async ({ page }) => {
  await openAdmin(page, EMAIL);
  await page.getByRole('link', { name: 'Безопасность' }).click();

  await page.getByRole('button', { name: 'Подключить' }).click();
  await expect(
    page.getByRole('img', { name: 'QR-код для приложения-аутентификатора' }),
  ).toBeVisible();
  secret = (await page.locator('code').textContent()) ?? '';
  expect(secret).toMatch(/^[A-Z2-7]{32}$/);

  await page.getByLabel('Код из приложения').fill('000000');
  await page.getByRole('button', { name: 'Включить' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Неверный код',
  );

  await page.getByLabel('Код из приложения').fill(totp(secret));
  await page.getByRole('button', { name: 'Включить' }).click();

  const list = page.getByRole('list', { name: 'Резервные коды' });
  await expect(list.getByRole('listitem')).toHaveCount(10);
  backupCodes = await list.getByRole('listitem').allTextContents();

  await page.getByRole('button', { name: 'Я сохранил коды' }).click();
  await expect(
    page.getByText('Второй фактор включён. Резервных кодов осталось: 10.'),
  ).toBeVisible();
});

test('вход: пароль, затем код из приложения', async ({ page }) => {
  await page.goto('/admin/login');
  await logIn(page, EMAIL);

  // Сессии ещё нет: без кода в админку не попасть
  const code = page.getByLabel('Код');
  await expect(code).toBeVisible();
  await page.goto('/admin/messages');
  await expect(page).toHaveURL(/\/admin\/login/);

  await logIn(page, EMAIL);
  // Код текущего шага ушёл на включение, тот же второй раз не примут
  await code.fill(totp(secret, 1));
  await page.getByRole('button', { name: 'Подтвердить' }).click();
  await expect(page).toHaveURL(/\/admin\/messages$/);
  await logOut(page);
});

test('вход резервным кодом и выключение', async ({ page }) => {
  await page.goto('/admin/login');
  await logIn(page, EMAIL);
  await page.getByLabel('Код').fill(backupCodes[0] ?? '');
  await page.getByRole('button', { name: 'Подтвердить' }).click();
  await expect(page).toHaveURL(/\/admin\/messages$/);

  await page.goto('/admin/security');
  await expect(page.getByText('Резервных кодов осталось: 9.')).toBeVisible();
  await page.getByRole('button', { name: 'Выключить второй фактор' }).click();
  await page
    .getByLabel('Код из приложения или резервный код')
    .fill(backupCodes[1] ?? '');
  await page.getByRole('button', { name: 'Выключить', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Подключить' })).toBeVisible();

  // Снова входим одним паролем
  await logOut(page);
  await logIn(page, EMAIL);
  await expect(page).toHaveURL(/\/admin\/messages$/);
});
