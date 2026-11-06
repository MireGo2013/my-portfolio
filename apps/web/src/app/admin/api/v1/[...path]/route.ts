import { ADMIN_COOKIES } from '@portfolio/shared';
import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import {
  callApi,
  clientIpFrom,
  refreshSession,
  type AdminCookies,
} from '@/lib/admin/api-forward';
import { isCrossSite } from '@/lib/admin/csrf';
import { CONTENT_TAGS, isContentSection } from '@/lib/content-tags';

// Прокси админки: браузер ходит на свой же адрес, а сервер сайта передаёт
// запрос в API. Так cookie сессии принадлежат сайту, а не чужому домену API.

/** Через прокси доступны только вход и эндпоинты админки, не весь API. */
const ALLOWED_ROOTS = new Set(['auth', 'admin']);

const notFound = () =>
  Response.json({ message: 'Не найдено' }, { status: 404 });

/**
 * Контент изменился — страницы сайта, которые его показывают, устарели.
 * expire: 0 — следующий посетитель ждёт свежие данные, а не получает старые
 * с обновлением в фоне: автор хочет сразу увидеть свою правку.
 */
function revalidateContent(method: string, path: string[], status: number) {
  const [root, area, section = ''] = path;
  if (
    method !== 'GET' &&
    status >= 200 &&
    status < 300 &&
    root === 'admin' &&
    area === 'content' &&
    isContentSection(section)
  ) {
    revalidateTag(CONTENT_TAGS[section], { expire: 0 });
  }
}

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
  // Адрес резюме и сам файл в Blob меняются только вместе, через
  // /admin/api/cv/[locale]. Прямая запись адреса оставила бы старый файл
  // в хранилище навсегда или указала бы на файл, который не загружали
  const [root, area, section] = path;
  if (
    root === 'admin' &&
    area === 'content' &&
    section === 'cv' &&
    request.method !== 'GET'
  ) {
    return notFound();
  }
  const apiPath =
    path.map(encodeURIComponent).join('/') + request.nextUrl.search;

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  if (hasBody && isCrossSite(request)) {
    return Response.json({ message: 'Запрос с чужого сайта' }, { status: 403 });
  }

  // Тело читаем один раз: при обновлении токена запрос придётся повторить
  const body = hasBody ? await request.arrayBuffer() : undefined;
  // Origin браузера в API не передаём: источник проверен здесь, по адресу,
  // на который браузер реально пришёл. API же видит запрос сервера сайта
  const call = {
    method: request.method,
    body,
    contentType: request.headers.get('content-type'),
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
    const refreshed = await refreshSession(cookies.refresh, call.clientIp);
    // При отказе cookie не стираем: параллельный запрос мог уже получить
    // новый токен, и пустой Set-Cookie удалил бы именно его
    if (refreshed.ok) {
      setCookies.push(...refreshed.setCookies);
      response = await callApi(apiPath, {
        ...call,
        cookies: refreshed.cookies,
      });
    }
  }

  revalidateContent(request.method, path, response.status);

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
