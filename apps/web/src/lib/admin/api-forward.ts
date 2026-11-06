import { ADMIN_COOKIES, API_PREFIX } from '@portfolio/shared';

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
 * IP посетителя для лимита входа. Заголовку x-real-ip верим только там,
 * где его перезаписывает платформа: на Vercel (там есть переменная VERCEL)
 * или за своим прокси, если это явно включено TRUST_X_REAL_IP=true.
 * Иначе заголовок прислал сам посетитель, и с секретом мы передали бы в API
 * любой выдуманный адрес: новый IP на каждую попытку — и лимита нет.
 * Без IP API считает лимит по адресу сервера сайта: общий, но честный.
 */
export function clientIpFrom(headers: Headers): string | undefined {
  const trusted =
    Boolean(process.env.VERCEL) || process.env.TRUST_X_REAL_IP === 'true';
  return trusted ? headers.get('x-real-ip') || undefined : undefined;
}

/**
 * Адрес сайта, каким его видит браузер. Не nextUrl.origin: Next.js строит
 * его из своего адреса (localhost), а за прокси браузер пришёл на другой.
 * X-Forwarded-Host может прийти списком через цепочку прокси — берём первый.
 */
export function publicOrigin(request: {
  headers: Headers;
  nextUrl: URL;
}): string {
  const first = (name: string) =>
    request.headers.get(name)?.split(',')[0]?.trim() || undefined;
  const host =
    first('x-forwarded-host') ?? first('host') ?? request.nextUrl.host;
  const proto =
    first('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
  return `${proto}://${host}`;
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
  | { ok: true; cookies: AdminCookies; setCookies: string[] }
  | { ok: false; setCookies: string[] }
> {
  const response = await callApi('auth/refresh', {
    method: 'POST',
    clientIp,
    cookies: { refresh: refreshToken },
  });
  const setCookies = response.headers.getSetCookie();
  if (!response.ok) return { ok: false, setCookies };
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
