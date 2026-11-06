import { ADMIN_COOKIES } from '@portfolio/shared';
import { NextResponse, type NextRequest } from 'next/server';
import {
  clearSessionCookies,
  clientIpFrom,
  refreshSession,
} from './api-forward';
import {
  ADMIN_API_BASE,
  ADMIN_LOGIN,
  ADMIN_PATH_HEADER,
  loginPath,
} from './paths';

/** Админка не должна попасть в поиск, даже если на неё где-то сослались. */
function noIndex(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

/**
 * В proxy.ts Next.js требует абсолютный адрес перенаправления. Строим его от
 * request.url, а Next.js, увидев тот же origin, сам отдаёт браузеру
 * относительный Location: хост из заголовков запроса в ответ не попадает.
 */
function redirectToLogin(request: NextRequest) {
  const path = loginPath(request.nextUrl.pathname + request.nextUrl.search);
  return noIndex(NextResponse.redirect(new URL(path, request.url)));
}

/**
 * Пропускает запрос дальше и сообщает layout, какая страница открыта:
 * серверный компонент сам адрес не знает, а он нужен для ?next= после входа.
 * Заголовок ставим всегда сами, поэтому присланный браузером не пройдёт.
 */
function passWithPath(request: NextRequest): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(
    ADMIN_PATH_HEADER,
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.next({ request: { headers } });
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
    return noIndex(passWithPath(request));
  }

  const refresh = request.cookies.get(ADMIN_COOKIES.refresh)?.value;
  if (!refresh) {
    return redirectToLogin(request);
  }

  try {
    const refreshed = await refreshSession(
      refresh,
      clientIpFrom(request.headers),
    );
    if (!refreshed.ok) {
      // Браузер прислал свою текущую cookie, и API её отверг: она мертва.
      // Стираем, иначе каждый переход по админке тратил бы запрос на обновление
      return clearSessionCookies(redirectToLogin(request));
    }

    // Новые cookie нужны уже этому запросу: их прочитает layout через cookies()
    const { access, refresh: nextRefresh } = refreshed.cookies;
    if (access) request.cookies.set(ADMIN_COOKIES.access, access);
    if (nextRefresh) request.cookies.set(ADMIN_COOKIES.refresh, nextRefresh);
    const response = passWithPath(request);
    // А эти уйдут в браузер
    for (const line of refreshed.setCookies) {
      response.headers.append('set-cookie', line);
    }
    return noIndex(response);
  } catch {
    return redirectToLogin(request);
  }
}
