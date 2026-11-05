import { FALLBACK_LOCALE, hasLocale, type Locale } from './config';

/** Вес языка из параметра "q=0.8". Без параметра вес 1, как требует стандарт. */
function parseWeight(params: string[]): number {
  const q = params.find((param) => param.startsWith('q='));
  return q ? Number(q.slice(2)) : 1;
}

/**
 * "ru-RU,ru;q=0.9, en; q=0.8" -> ["ru", "ru", "en"] по убыванию веса.
 * Стандарт разрешает пробелы вокруг ";", поэтому каждую часть обрезаем.
 */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part
        .split(';')
        .map((piece) => piece.trim());
      return {
        language: tag.split('-')[0]?.toLowerCase() ?? '',
        q: parseWeight(params),
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
  return preferred ?? FALLBACK_LOCALE;
}
