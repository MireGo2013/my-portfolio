import { ADMIN_COOKIES } from '@portfolio/shared';
import { NextResponse, type NextRequest } from 'next/server';
import {
  callApi,
  clientIpFrom,
  publicOrigin,
  refreshSession,
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
  // Адрес, на который пришёл браузер: за прокси nextUrl указал бы на localhost
  const origin = publicOrigin(request);
  const redirect = (path: string, setCookies: string[] = []) => {
    const response = NextResponse.redirect(new URL(path, origin));
    for (const line of setCookies) response.headers.append('set-cookie', line);
    return response;
  };
  const toLogin = (setCookies?: string[]) =>
    redirect(`${ADMIN_LOGIN}?next=${encodeURIComponent(next)}`, setCookies);

  const refresh = request.cookies.get(ADMIN_COOKIES.refresh)?.value;
  if (!refresh) return toLogin();

  try {
    const refreshed = await refreshSession(
      refresh,
      clientIpFrom(request.headers),
    );
    if (!refreshed.ok) return toLogin(refreshed.setCookies);

    // Проверяем новый токен до перехода: иначе при отказе по другой причине
    // layout отправил бы сюда снова, и вышел бы бесконечный цикл
    const me = await callApi('auth/me', {
      method: 'GET',
      cookies: refreshed.cookies,
    });
    if (!me.ok) return toLogin(refreshed.setCookies);

    return redirect(next, refreshed.setCookies);
  } catch {
    return toLogin();
  }
}
