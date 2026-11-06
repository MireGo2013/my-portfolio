import { ADMIN_COOKIES } from '@portfolio/shared';
import { NextResponse, type NextRequest } from 'next/server';
import {
  callApi,
  clientIpFrom,
  readAuthCookies,
} from '@/lib/admin/api-forward';
import { ADMIN_LOGIN, safeNextPath } from '@/lib/admin/paths';

/**
 * Сюда layout админки отправляет, когда API отверг токен доступа: истёк
 * на миллисекунды раньше cookie, сменился JWT_SECRET. Серверный компонент
 * не умеет ставить cookie, а route handler умеет. Обновляем токен и
 * возвращаем на ту же страницу.
 *
 * GET меняет состояние, но безопасно: в худшем случае чужая ссылка заставит
 * браузер обновить собственный токен и открыть страницу админки.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const next = safeNextPath(request.nextUrl.searchParams.get('next'));
  const toLogin = (setCookies: string[] = []) => {
    const url = new URL(ADMIN_LOGIN, request.nextUrl.origin);
    url.searchParams.set('next', next);
    const response = NextResponse.redirect(url);
    for (const line of setCookies) response.headers.append('set-cookie', line);
    return response;
  };

  const refresh = request.cookies.get(ADMIN_COOKIES.refresh)?.value;
  if (!refresh) return toLogin();

  try {
    const refreshed = await callApi('auth/refresh', {
      method: 'POST',
      clientIp: clientIpFrom(request.headers),
      cookies: { refresh },
    });
    const setCookies = refreshed.headers.getSetCookie();
    if (!refreshed.ok) return toLogin(setCookies);

    // Проверяем новый токен до перехода: иначе при отказе по другой причине
    // layout отправил бы сюда снова, и вышел бы бесконечный цикл
    const me = await callApi('auth/me', {
      method: 'GET',
      cookies: { refresh, ...readAuthCookies(setCookies) },
    });
    if (!me.ok) return toLogin(setCookies);

    const response = NextResponse.redirect(
      new URL(next, request.nextUrl.origin),
    );
    for (const line of setCookies) response.headers.append('set-cookie', line);
    return response;
  } catch {
    return toLogin();
  }
}
