import { ADMIN_COOKIES } from '@portfolio/shared';
import type { NextRequest } from 'next/server';
import {
  callApi,
  clientIpFrom,
  refreshSession,
  type AdminCookies,
} from './api-forward';

/**
 * Для route handler, который делает что-то сам, а не просто передаёт
 * запрос в API: например, кладёт файл в хранилище. Права надо проверить
 * до этого, иначе файл успел бы загрузиться у кого угодно.
 *
 * Как и прокси-маршрут, при истёкшем токене доступа обновляет его.
 * setCookies — новые cookie, их надо отдать браузеру в ответе.
 */
export async function authorizeAdmin(
  request: NextRequest,
): Promise<
  { ok: true; cookies: AdminCookies; setCookies: string[] } | { ok: false }
> {
  const cookies: AdminCookies = {
    access: request.cookies.get(ADMIN_COOKIES.access)?.value,
    refresh: request.cookies.get(ADMIN_COOKIES.refresh)?.value,
  };
  const me = (current: AdminCookies) =>
    callApi('auth/me', { method: 'GET', cookies: current });

  if (cookies.access && (await me(cookies)).ok) {
    return { ok: true, cookies, setCookies: [] };
  }
  if (!cookies.refresh) return { ok: false };

  const refreshed = await refreshSession(
    cookies.refresh,
    clientIpFrom(request.headers),
  );
  if (!refreshed.ok || !(await me(refreshed.cookies)).ok) {
    return { ok: false };
  }
  return {
    ok: true,
    cookies: refreshed.cookies,
    setCookies: refreshed.setCookies,
  };
}
