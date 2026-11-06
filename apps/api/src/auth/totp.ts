import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// TOTP по RFC 6238 поверх HOTP из RFC 4226. Своя реализация вместо пакета:
// это три десятка строк, и каждую можно объяснить
//
// HOTP(K, C) = Truncate(HMAC-SHA1(K, C)) mod 10^digits
// TOTP(K, T) = HOTP(K, floor(T / 30)) — C это номер 30-секундного интервала

export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;
/** Принимаем соседние интервалы: часы телефона и сервера чуть расходятся. */
const WINDOW = 1;

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Base32 без «=» — так секрет вводят в приложение руками и кладут в QR. */
export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(text: string): Buffer {
  const clean = text.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error('Неверный символ base32');
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

/** 20 случайных байт = 160 бит, как советует RFC 4226 для HMAC-SHA1. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** HOTP: HMAC от номера шага и «динамическое усечение» до нужного числа цифр. */
export function hotp(secret: Buffer, counter: number, digits = TOTP_DIGITS) {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', secret).update(message).digest();
  // Последние 4 бита хеша выбирают, с какого байта взять 31 бит
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** digits).padStart(digits, '0');
}

export function totpStep(nowMs = Date.now()): number {
  return Math.floor(nowMs / 1000 / TOTP_PERIOD_SECONDS);
}

/**
 * Номер шага, для которого код верен, или null. Номер нужен, чтобы
 * не принять тот же код второй раз: шаг не может быть меньше или равен
 * последнему использованному.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  nowMs = Date.now(),
): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const secret = base32Decode(secretBase32);
  const current = totpStep(nowMs);
  for (let shift = -WINDOW; shift <= WINDOW; shift += 1) {
    const step = current + shift;
    const expected = Buffer.from(hotp(secret, step));
    // Сравнение за постоянное время: по скорости ответа код не подобрать
    if (timingSafeEqual(expected, Buffer.from(code))) return step;
  }
  return null;
}

/** Ссылка для QR-кода: её понимают все приложения-аутентификаторы. */
export function otpauthUrl(secretBase32: string, account: string): string {
  const issuer = 'Portfolio admin';
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
