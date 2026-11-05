import { InternalServerErrorException, Query } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { DEFAULT_LOCALE, LOCALES, localeSchema } from '@portfolio/shared';
import { ZodValidationPipe } from './zod-validation.pipe.js';

/** Параметр ?locale=: проверяет значение и подставляет язык по умолчанию. */
export const LocaleQuery = () =>
  Query('locale', new ZodValidationPipe(localeSchema, 'locale'));

/** Описание параметра ?locale= для OpenAPI. */
export const ApiLocaleQuery = () =>
  ApiQuery({
    name: 'locale',
    enum: LOCALES,
    required: false,
    description: `Язык контента, по умолчанию ${DEFAULT_LOCALE}`,
  });

/**
 * Запрос выбирает перевод только на нужном языке, поэтому в массиве одна запись.
 * Её отсутствие означает ошибку в данных: seed требует тексты на всех языках.
 */
export function singleTranslation<T>(translations: T[]): T {
  const [translation] = translations;
  if (!translation) {
    throw new InternalServerErrorException('Нет перевода контента');
  }
  return translation;
}
