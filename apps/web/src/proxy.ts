import { NextResponse, type NextRequest } from 'next/server';
import { hasLocale, LOCALE_COOKIE } from './i18n/config';
import { pickLocale } from './i18n/pick-locale';

/** Адрес без языка ведёт на тот же адрес с языком: / -> /ru, /skills -> /en/skills. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split('/')[1] ?? '';

  if (hasLocale(firstSegment)) {
    return NextResponse.next();
  }

  const locale = pickLocale(
    request.cookies.get(LOCALE_COOKIE)?.value,
    request.headers.get('accept-language'),
  );
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Служебные файлы Next.js и файлы с расширением (PDF, иконка) проходят мимо
  matcher: ['/((?!_next|.*\\..*).*)'],
};
