import { ADMIN_COOKIES } from '@portfolio/shared';
import type { NextRequest } from 'next/server';
import {
  callApi,
  clientIpFrom,
  readAuthCookies,
  type AdminCookies,
} from '@/lib/admin/api-forward';

// Прокси админки: браузер ходит на свой же адрес, а сервер сайта передаёт
// запрос в API. Так cookie сессии принадлежат сайту, а не чужому домену API.

/** Через прокси доступны только вход и эндпоинты админки, не весь API. */
const ALLOWED_ROOTS = new Set(['auth', 'admin']);

const notFound = () =>
  Response.json({ message: 'Не найдено' }, { status: 404 });

async function handle(
  request: NextRequest,
  { params }: RouteContext<'/admin/api/v1/[...path]'>,
): Promise<Response> {
  const { path } = await params;
  // Сегменты . и .. после склейки адреса вывели бы запрос за пределы разрешённых
  if (
    !ALLOWED_ROOTS.has(path[0] ?? '') ||
    path.some((segment) => segment === '.' || segment === '..')
  ) {
    return notFound();
  }
  const apiPath =
    path.map(encodeURIComponent).join('/') + request.nextUrl.search;

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  // Тело читаем один раз: при обновлении токена запрос придётся повторить
  const body = hasBody ? await request.arrayBuffer() : undefined;
  const call = {
    method: request.method,
    body,
    contentType: request.headers.get('content-type'),
    origin: request.headers.get('origin'),
    clientIp: clientIpFrom(request.headers),
  };
  const cookies: AdminCookies = {
    access: request.cookies.get(ADMIN_COOKIES.access)?.value,
    refresh: request.cookies.get(ADMIN_COOKIES.refresh)?.value,
  };

  let response = await callApi(apiPath, { ...call, cookies });
  const setCookies: string[] = [];

  // Токен доступа истёк: обновляем и повторяем запрос, клиент этого не замечает.
  // Для самих эндпоинтов входа не повторяем: 401 там значит именно 401
  if (response.status === 401 && path[0] !== 'auth' && cookies.refresh) {
    const refreshed = await callApi('auth/refresh', {
      method: 'POST',
      origin: call.origin,
      clientIp: call.clientIp,
      cookies: { refresh: cookies.refresh },
    });
    setCookies.push(...refreshed.headers.getSetCookie());
    if (refreshed.ok) {
      response = await callApi(apiPath, {
        ...call,
        cookies: readAuthCookies(setCookies),
      });
    }
  }

  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  for (const line of [...setCookies, ...response.headers.getSetCookie()]) {
    headers.append('set-cookie', line);
  }
  headers.set('cache-control', 'no-store');

  return new Response(response.status === 204 ? null : response.body, {
    status: response.status,
    headers,
  });
}

export {
  handle as DELETE,
  handle as GET,
  handle as PATCH,
  handle as POST,
  handle as PUT,
};
