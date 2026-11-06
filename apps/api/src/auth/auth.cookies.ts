import { ADMIN_COOKIES } from '@portfolio/shared';
import type { CookieOptions, Request, Response } from 'express';
import { ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS } from './auth.constants.js';
import type { AuthTokens } from './auth.service.js';

// httpOnly: скрипт страницы cookie не прочитает, даже если на неё внедрят чужой код.
// secure: только по HTTPS. Браузеры делают исключение для http://localhost.
// sameSite lax: с чужого сайта cookie уходит только при переходе по ссылке (GET),
// а в POST-запросах с чужих страниц её нет.
// path '/': сайт проверяет вход на страницах /admin, поэтому обе cookie нужны ему везде
const baseOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
};

export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  res.cookie(ADMIN_COOKIES.access, tokens.accessToken, {
    ...baseOptions,
    maxAge: ACCESS_TOKEN_TTL_MS,
  });
  res.cookie(ADMIN_COOKIES.refresh, tokens.refreshToken, {
    ...baseOptions,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ADMIN_COOKIES.access, baseOptions);
  res.clearCookie(ADMIN_COOKIES.refresh, baseOptions);
}

/** Значение cookie или undefined. cookie-parser кладёт их в req.cookies. */
export function readCookie(
  req: Request,
  name: (typeof ADMIN_COOKIES)[keyof typeof ADMIN_COOKIES],
): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[name];
  return typeof value === 'string' && value !== '' ? value : undefined;
}
