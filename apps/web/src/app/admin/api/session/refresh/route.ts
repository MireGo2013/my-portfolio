import { ADMIN_COOKIES } from '@portfolio/shared';
import type { NextRequest, NextResponse } from 'next/server';
import {
  callApi,
  clearSessionCookies,
  clientIpFrom,
  redirectTo,
  refreshSession,
} from '@/features/admin/server/api-forward';
import { loginPath, safeNextPath } from '@/features/admin/shell/paths';

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
  // Сюда приходят переходом по странице: браузер прислал свои текущие cookie,
  // и раз они не сработали, они мертвы — стираем
  const toLogin = () => clearSessionCookies(redirectTo(loginPath(next)));

  const refresh = request.cookies.get(ADMIN_COOKIES.refresh)?.value;
  if (!refresh) return toLogin();

  try {
    const refreshed = await refreshSession(
      refresh,
      clientIpFrom(request.headers),
    );
    if (!refreshed.ok) return toLogin();

    // Проверяем новый токен до перехода: иначе при отказе по другой причине
    // layout отправил бы сюда снова, и вышел бы бесконечный цикл
    const me = await callApi('auth/me', {
      method: 'GET',
      cookies: refreshed.cookies,
    });
    if (!me.ok) return toLogin();

    const response = redirectTo(next);
    for (const line of refreshed.setCookies) {
      response.headers.append('set-cookie', line);
    }
    return response;
  } catch {
    return toLogin();
  }
}
