import { NextResponse, type NextRequest } from 'next/server';
import { hasLocale, LOCALE_COOKIE, type Locale } from './i18n/config';
import { pickLocale } from './i18n/pick-locale';
import { adminProxy } from './lib/admin/admin-proxy';
import { isAdminPath } from './lib/admin/paths';
import { isSitePath, NOT_FOUND_PATH } from './lib/site-sections';

/**
 * Обычная страница «не найдено» с кодом 404. Встроенный not-found здесь не
 * подходит: при корневом layout в [lang] Next.js не может отрисовать его на
 * сервере и отдаёт пустой HTML. А rewrite не умеет менять код ответа: страница
 * пришла бы с кодом 200. Поэтому берём готовую страницу и отдаём её сами.
 */
async function notFoundResponse(
  request: NextRequest,
  locale: Locale,
): Promise<NextResponse> {
  try {
    const page = await fetch(
      new URL(`/${locale}${NOT_FOUND_PATH}`, request.nextUrl.origin),
    );
    return new NextResponse(page.body, {
      status: 404,
      headers: {
        'content-type':
          page.headers.get('content-type') ?? 'text/html; charset=utf-8',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}

/** Адрес без языка ведёт на тот же адрес с языком: / -> /ru, /skills -> /en/skills. */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  // Админка живёт отдельно от разделов сайта и без языка в адресе
  if (isAdminPath(pathname)) {
    return adminProxy(request);
  }

  const firstSegment = pathname.split('/')[1] ?? '';
  const hasLocalePrefix = hasLocale(firstSegment);
  const locale = hasLocalePrefix
    ? firstSegment
    : pickLocale(
        request.cookies.get(LOCALE_COOKIE)?.value,
        request.headers.get('accept-language'),
      );

  // Адрес без языка: '/en/skills' -> '/skills', '/en' -> '', '/' -> ''
  const rest = hasLocalePrefix
    ? pathname.slice(firstSegment.length + 1)
    : pathname;
  const sitePath = rest === '/' ? '' : rest;

  // Саму страницу 404 пропускаем: её запрашивает notFoundResponse
  if (hasLocalePrefix && sitePath === NOT_FOUND_PATH) {
    return NextResponse.next();
  }

  if (!isSitePath(sitePath)) {
    return notFoundResponse(request, locale);
  }

  if (hasLocalePrefix) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${sitePath}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Мимо proxy проходят служебные файлы Next.js и файлы сайта. Новые файлы
  // в public кладём в assets/ (или cv/), иначе proxy ответит на них 404
  matcher: ['/((?!_next/|assets/|cv/|icon\\.svg).*)'],
};
