import { BadRequestException } from '@nestjs/common';
import { LOCALES, type Locale } from '@portfolio/shared';

/** Строки переводов из базы → объект { ru, en }. */
export function byLocale<T extends { locale: Locale }>(
  rows: T[],
): Record<Locale, Omit<T, 'locale'>> {
  const result = {} as Record<Locale, Omit<T, 'locale'>>;
  for (const locale of LOCALES) {
    const row = rows.find((item) => item.locale === locale);
    if (!row) {
      throw new Error(`Нет перевода на ${locale}`);
    }
    const { locale: rowLocale, ...rest } = row;
    result[locale] = rest;
  }
  return result;
}

/** Объект { ru, en } → строки переводов для createMany. */
export function toTranslationRows<T extends object>(
  translations: Record<Locale, T>,
): (T & { locale: Locale })[] {
  return LOCALES.map((locale) => ({ ...translations[locale], locale }));
}

/** 'YYYY-MM' ↔ дата первого числа месяца в UTC, как в seed. */
export const monthToDate = (month: string) => new Date(`${month}-01T00:00:00Z`);
export const dateToMonth = (date: Date) => date.toISOString().slice(0, 7);

/** Новый порядок должен перечислить ровно те записи, что есть в разделе. */
export function assertSameIds(existing: string[], next: string[]): void {
  const known = new Set(existing);
  if (next.length !== known.size || next.some((id) => !known.has(id))) {
    throw new BadRequestException({
      message: 'Порядок должен перечислять все записи раздела по одному разу',
      errors: { ids: ['mismatch'] },
    });
  }
}
