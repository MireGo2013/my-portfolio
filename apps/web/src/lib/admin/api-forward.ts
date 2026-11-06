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
 * IP посетителя. На Vercel заголовок x-real-ip выставляет сама платформа,
 * и посетитель не может его подменить. Локально его нет, и API считает
 * лимит по адресу сервера сайта.
 */
export function clientIpFrom(headers: Headers): string | undefined {
  return headers.get('x-real-ip') || undefined;
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
