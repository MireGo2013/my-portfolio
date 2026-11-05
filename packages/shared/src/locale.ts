import { z } from 'zod';

export const LOCALES = ['ru', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';

/** Язык контента в запросе к API. Без параметра отдаём язык по умолчанию. */
export const localeSchema = z.enum(LOCALES).default(DEFAULT_LOCALE);
