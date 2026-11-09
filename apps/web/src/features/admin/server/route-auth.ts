import { ADMIN_COOKIES } from '@portfolio/shared';
import type { NextRequest } from 'next/server';
import {
  callApi,
  clientIpFrom,
  refreshSession,
  type AdminCookies,
} from './api-forward';

export type AdminAuth =
  | { ok: true; cookies: AdminCookies; setCookies: string[] }
  | { ok: false; status: 401 | 502; setCookies: string[] };

/**
 * Для route handler, который делает что-то сам, а не просто передаёт
 * запрос в API: например, кладёт файл в хранилище. Права надо проверить
 * до этого, иначе файл успел бы загрузиться у кого угодно.
 *
 * Как и прокси-маршрут, при истёкшем токене доступа обновляет его, и только
 * на 401: сбой API (5xx) — не повод тратить токен обновления.
 *
 * setCookies есть и в отказе: если токен обновился, а дальше что-то не так,
 * браузер всё равно должен получить новые cookie, иначе после льготного окна
 * его прежний токен обновления перестанет работать.
 */
export async function authorizeAdmin(request: NextRequest): Promise<AdminAuth> {
  const cookies: AdminCookies = {
    access: request.cookies.get(ADMIN_COOKIES.access)?.value,
    refresh: request.cookies.get(ADMIN_COOKIES.refresh)?.value,
  };
  const me = (current: AdminCookies) =>
    callApi('auth/me', { method: 'GET', cookies: current }).then(
      (response) => response.status,
    );

  const first = cookies.access ? await me(cookies) : 401;
  if (first >= 200 && first < 300) {
    return { ok: true, cookies, setCookies: [] };
  }
  if (first !== 401) return { ok: false, status: 502, setCookies: [] };
  if (!cookies.refresh) return { ok: false, status: 401, setCookies: [] };

  const refreshed = await refreshSession(
    cookies.refresh,
    clientIpFrom(request.headers),
  );
  if (!refreshed.ok) return { ok: false, status: 401, setCookies: [] };

  const second = await me(refreshed.cookies);
  if (second >= 200 && second < 300) {
    return {
      ok: true,
      cookies: refreshed.cookies,
      setCookies: refreshed.setCookies,
    };
  }
  return {
    ok: false,
    status: second === 401 ? 401 : 502,
    setCookies: refreshed.setCookies,
  };
}
