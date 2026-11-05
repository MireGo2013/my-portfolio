import { FALLBACK_LOCALE, hasLocale, type Locale } from './config';

/** "ru-RU,ru;q=0.9,en;q=0.8" -> ["ru", "ru", "en"], по убыванию приоритета q. */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((part) => {
      const [tag = '', q] = part.trim().split(';q=');
      return {
        language: tag.split('-')[0]?.toLowerCase() ?? '',
        q: Number(q ?? 1),
      };
    })
    .filter(({ q }) => q > 0)
    .sort((a, b) => b.q - a.q)
    .map(({ language }) => language);
}

/** Выбор посетителя в cookie важнее настроек браузера. */
export function pickLocale(
  cookie: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (cookie && hasLocale(cookie)) {
    return cookie;
  }
  const preferred = parseAcceptLanguage(acceptLanguage ?? '').find(hasLocale);
  return preferred && hasLocale(preferred) ? preferred : FALLBACK_LOCALE;
}
