import { describe, expect, it } from 'vitest';
import {
  base32Decode,
  base32Encode,
  generateTotpSecret,
  hotp,
  otpauthUrl,
  verifyTotp,
} from './totp.js';

// Ключ из тестовых векторов RFC 4226 и RFC 6238 (SHA-1)
const RFC_KEY = Buffer.from('12345678901234567890', 'ascii');

describe('HOTP по RFC 4226, приложение D', () => {
  it.each([
    [0, '755224'],
    [1, '287082'],
    [2, '359152'],
    [3, '969429'],
    [9, '520489'],
  ])('счётчик %i даёт %s', (counter, code) => {
    expect(hotp(RFC_KEY, counter)).toBe(code);
  });
});

describe('TOTP по RFC 6238, приложение B', () => {
  it.each([
    [59, '94287082'],
    [1111111109, '07081804'],
    [1234567890, '89005924'],
    [2000000000, '69279037'],
  ])('время %i даёт %s', (seconds, code) => {
    expect(hotp(RFC_KEY, Math.floor(seconds / 30), 8)).toBe(code);
  });
});

describe('verifyTotp', () => {
  const secret = base32Encode(RFC_KEY);
  const at = (seconds: number) => seconds * 1000;

  it('принимает код текущего и соседних интервалов и возвращает номер шага', () => {
    // В 59 секунд шаг 1, его код — 287082
    expect(verifyTotp(secret, '287082', at(59))).toBe(1);
    expect(verifyTotp(secret, '287082', at(61))).toBe(1); // шаг 2, код прошлого
    expect(verifyTotp(secret, '287082', at(95))).toBe(null); // шаг 3 — поздно
  });

  it('с пустым или коротким ключом не принимает ничего', () => {
    const empty = hotp(Buffer.alloc(0), 1);
    expect(verifyTotp('', empty, at(59))).toBe(null);
    expect(
      verifyTotp('GEZDGNBV', hotp(base32Decode('GEZDGNBV'), 1), at(59)),
    ).toBe(null);
  });

  it('отклоняет не шесть цифр', () => {
    expect(verifyTotp(secret, '28708', at(59))).toBe(null);
    expect(verifyTotp(secret, '28708a', at(59))).toBe(null);
  });
});

describe('base32 и секрет', () => {
  it('кодирует и раскодирует без потерь', () => {
    expect(base32Encode(RFC_KEY)).toBe('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    expect(base32Decode(base32Encode(RFC_KEY)).equals(RFC_KEY)).toBe(true);
  });

  it('секрет — 160 бит в base32', () => {
    expect(generateTotpSecret()).toMatch(/^[A-Z2-7]{32}$/);
  });

  it('ссылка для приложения-аутентификатора', () => {
    expect(otpauthUrl('ABC', 'a@b.c')).toBe(
      'otpauth://totp/Portfolio%20admin%3Aa%40b.c?secret=ABC&issuer=Portfolio+admin&algorithm=SHA1&digits=6&period=30',
    );
  });
});
