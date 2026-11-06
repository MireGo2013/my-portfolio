import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { LOCALES, type Locale } from '@portfolio/shared';
import { Prisma } from '../generated/prisma/client.js';

export const notFound = () => new NotFoundException('Запись не найдена');

/**
 * Ошибки Prisma, которые означают ошибку запроса, а не сервера.
 * Ответ на занятый slug — в том же формате, что ошибки валидации:
 * форма подсветит поле.
 */
export function mapPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new ConflictException({
        message: 'Такой slug уже занят',
        errors: { slug: ['slugTaken'] },
      });
    }
    if (error.code === 'P2025') {
      throw notFound();
    }
  }
  throw error;
}

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
