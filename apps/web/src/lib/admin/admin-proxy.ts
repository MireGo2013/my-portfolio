import { ADMIN_COOKIES } from '@portfolio/shared';
import { NextResponse, type NextRequest } from 'next/server';
import { callApi, clientIpFrom, readAuthCookies } from './api-forward';
import { ADMIN_API_BASE, ADMIN_LOGIN } from './paths';

/** Админка не должна попасть в поиск, даже если на неё где-то сослались. */
function noIndex(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

function redirectToLogin(request: NextRequest, setCookies: string[] = []) {
  const url = request.nextUrl.clone();
  url.pathname = ADMIN_LOGIN;
  url.search = '';
  url.searchParams.set(
    'next',
    request.nextUrl.pathname + request.nextUrl.search,
  );
  const response = NextResponse.redirect(url);
  // Если API стёр мёртвые cookie, стираем их и в браузере
  for (const line of setCookies) response.headers.append('set-cookie', line);
  return noIndex(response);
}

/**
 * Быстрая проверка для страниц /admin: есть ли cookie сессии. Это не защита,
 * а удобство: без cookie сразу ведём на вход, не рисуя страницу. Настоящая
 * проверка — запрос к API в layout админки.
 *
 * Токен доступа живёт 15 минут, и браузер удаляет cookie вместе с ним.
 * Тогда здесь же обновляем его по токену обновления: в отличие от серверных
 * компонентов, proxy умеет ставить cookie.
 */
export async function adminProxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith(ADMIN_API_BASE) || pathname === ADMIN_LOGIN) {
    return noIndex(NextResponse.next());
  }
  if (request.cookies.has(ADMIN_COOKIES.access)) {
    return noIndex(NextResponse.next());
  }

  const refresh = request.cookies.get(ADMIN_COOKIES.refresh)?.value;
  if (!refresh) {
    return redirectToLogin(request);
  }

  try {
    const refreshed = await callApi('auth/refresh', {
      method: 'POST',
      clientIp: clientIpFrom(request.headers),
      cookies: { refresh },
    });
    const setCookies = refreshed.headers.getSetCookie();
    if (!refreshed.ok) {
      return redirectToLogin(request, setCookies);
    }

    // Новые cookie нужны уже этому запросу: их прочитает layout через cookies()
    const fresh = readAuthCookies(setCookies);
    if (fresh.access) request.cookies.set(ADMIN_COOKIES.access, fresh.access);
    if (fresh.refresh) {
      request.cookies.set(ADMIN_COOKIES.refresh, fresh.refresh);
    }
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    // А эти уйдут в браузер
    for (const line of setCookies) response.headers.append('set-cookie', line);
    return noIndex(response);
  } catch {
    return redirectToLogin(request);
  }
}
