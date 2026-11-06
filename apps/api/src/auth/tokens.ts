import { createHash, randomBytes } from 'node:crypto';

/**
 * Токен обновления: 32 случайных байта. Это не JWT, а просто секрет,
 * по которому сервер находит сессию в базе.
 */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Хеш токена для базы. Токен случайный и длинный, перебрать его нельзя,
 * поэтому хватает быстрого SHA-256. Медленный argon2 нужен только паролям,
 * которые придумывают люди.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
