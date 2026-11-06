import { ADMIN_COOKIES, API_PREFIX } from '@portfolio/shared';
import { NextResponse } from 'next/server';

// Без 'server-only': модуль импортирует и proxy.ts, а там этот пакет не работает.
// Секрет при этом в браузер не попадает: клиентские компоненты модуль не используют

export type AdminCookies = Partial<
  Record<keyof typeof ADMIN_COOKIES, string | undefined>
>;

type ApiCall = {
  method: string;
  body?: BodyInit;
  contentType?: string | null;
  clientIp?: string;
  cookies?: AdminCookies;
};

function apiBaseUrl(): string {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error('Не задан API_URL');
  }
  return apiUrl;
}

/**
 * IP посетителя для лимита входа. Заголовку x-real-ip верим, только если
 * это явно включено: TRUST_X_REAL_IP=true там, где его перезаписывает
 * платформа (на Vercel — в окружениях Production и Preview). Иначе заголовок
 * прислал сам посетитель, и с секретом мы передали бы в API любой
 * выдуманный адрес: новый IP на каждую попытку — и лимита нет.
 *
 * Автоопределение по переменной VERCEL не годится: `vercel env pull`
 * кладёт её в .env.local, и доверие включилось бы там, где его нет.
 * Без IP API считает лимит по адресу сервера сайта: общий, но честный.
 */
export function clientIpFrom(headers: Headers): string | undefined {
  return process.env.TRUST_X_REAL_IP === 'true'
    ? headers.get('x-real-ip') || undefined
    : undefined;
}

/**
 * Хост, на который пришёл браузер, — только для сравнения с Origin.
 * Не nextUrl.host: Next.js строит его из своего адреса (localhost).
 * X-Forwarded-Host через цепочку прокси приходит списком — берём первый.
 */
export function requestHost(headers: Headers): string | undefined {
  const first = (name: string) =>
    headers.get(name)?.split(',')[0]?.trim() || undefined;
  return first('x-forwarded-host') ?? first('host');
}

/**
 * Перенаправление с относительным адресом. Браузер сам подставит хост,
 * на который пришёл, поэтому заголовки запроса (Host, X-Forwarded-Host)
 * не влияют на то, куда он уйдёт: подменить цель перехода нельзя.
 */
export function redirectTo(location: string): NextResponse {
  return new NextResponse(null, { status: 307, headers: { location } });
}

/**
 * Стирает cookie сессии. Только при переходе по странице: браузер прислал
 * ту cookie, которая лежит у него прямо сейчас, и раз API её отверг,
 * она мертва. В запросах данных так делать нельзя: параллельный запрос
 * мог уже получить новый токен, и мы стёрли бы его.
 */
export function clearSessionCookies(response: NextResponse): NextResponse {
  for (const name of Object.values(ADMIN_COOKIES)) {
    response.cookies.set(name, '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
  }
  return response;
}

/**
 * Обновление сессии по токену обновления. Одно место для proxy.ts,
 * прокси-маршрута и маршрута обновления: отличается только то, что они
 * делают с результатом.
 *
 * cookies — токены, с которыми теперь ходить в API: новый токен доступа
 * и новый токен обновления, а если его нет (соседний запрос уже заменил),
 * прежний. setCookies — строки Set-Cookie для браузера.
 */
export async function refreshSession(
  refreshToken: string,
  clientIp: string | undefined,
): Promise<
  { ok: true; cookies: AdminCookies; setCookies: string[] } | { ok: false }
> {
  const response = await callApi('auth/refresh', {
    method: 'POST',
    clientIp,
    cookies: { refresh: refreshToken },
  });
  if (!response.ok) return { ok: false };
  const setCookies = response.headers.getSetCookie();
  return {
    ok: true,
    cookies: { refresh: refreshToken, ...readAuthCookies(setCookies) },
    setCookies,
  };
}

/** Из нескольких cookie браузера в API уходят только cookie админки. */
function cookieHeader(cookies: AdminCookies): string {
  return (Object.keys(ADMIN_COOKIES) as (keyof typeof ADMIN_COOKIES)[])
    .filter((key) => cookies[key])
    .map((key) => `${ADMIN_COOKIES[key]}=${cookies[key]}`)
    .join('; ');
}

/**
 * Запрос к API от имени посетителя. С PROXY_SECRET API поверит присланному IP
 * и посчитает лимит входа для этого посетителя, а не для всего сервера сайта.
 */
export function callApi(path: string, call: ApiCall): Promise<Response> {
  const headers = new Headers();
  if (call.contentType) headers.set('content-type', call.contentType);
  const cookie = call.cookies ? cookieHeader(call.cookies) : '';
  if (cookie) headers.set('cookie', cookie);

  const secret = process.env.PROXY_SECRET;
  if (secret && call.clientIp) {
    headers.set('x-proxy-secret', secret);
    headers.set('x-client-ip', call.clientIp);
  }

  return fetch(`${apiBaseUrl()}${API_PREFIX}/${path}`, {
    method: call.method,
    headers,
    body: call.body,
    cache: 'no-store',
    redirect: 'manual',
  });
}

/** Значения cookie админки из заголовков Set-Cookie ответа API. */
export function readAuthCookies(setCookies: string[]): AdminCookies {
  const result: AdminCookies = {};
  for (const line of setCookies) {
    const [pair = ''] = line.split(';');
    const separator = pair.indexOf('=');
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (name === ADMIN_COOKIES.access) result.access = value;
    if (name === ADMIN_COOKIES.refresh) result.refresh = value;
  }
  return result;
}
