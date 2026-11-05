import { NextResponse, type NextRequest } from 'next/server';
import { hasLocale, LOCALE_COOKIE } from './i18n/config';
import { pickLocale } from './i18n/pick-locale';

/**
 * Адрес без языка ведёт на тот же адрес с языком: / -> /ru, /skills -> /en/skills.
 * Несуществующий файл (/favicon.ico, /ru/foo.bar) Next.js отдал бы пустой
 * страницей 404, поэтому показываем вместо неё оформленную 404 нужного языка.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/')[1] ?? '';
  const locale = hasLocale(firstSegment)
    ? firstSegment
    : pickLocale(
        request.cookies.get(LOCALE_COOKIE)?.value,
        request.headers.get('accept-language'),
      );

  const lastSegment = pathname.split('/').at(-1) ?? '';
  if (lastSegment.includes('.')) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/not-found`;
    return NextResponse.rewrite(url, { status: 404 });
  }

  if (hasLocale(firstSegment)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Мимо proxy проходят служебные файлы Next.js и файлы сайта. Новые файлы
  // в public кладём в assets/ (или cv/), иначе proxy ответит на них 404
  matcher: ['/((?!_next/|assets/|cv/|icon\\.svg).*)'],
};
