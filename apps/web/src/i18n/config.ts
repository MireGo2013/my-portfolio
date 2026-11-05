import { LOCALES, type Locale } from '@portfolio/shared';

export { LOCALES, type Locale };

/** Куда попадает посетитель, если ни один язык из его браузера не подходит. */
export const FALLBACK_LOCALE: Locale = 'en';

/** Cookie с языком, который посетитель выбрал сам в переключателе. */
export const LOCALE_COOKIE = 'locale';

export function hasLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Адрес PDF с резюме на нужном языке. */
export function resumeUrl(locale: Locale): string {
  return `/cv/Sobol_Vladislav_CV_${locale.toUpperCase()}.pdf`;
}

/** Адрес той же страницы на другом языке: /ru/skills -> /en/skills. */
export function switchLocalePath(pathname: string, locale: Locale): string {
  const [, , ...rest] = pathname.split('/');
  return ['', locale, ...rest].join('/');
}
