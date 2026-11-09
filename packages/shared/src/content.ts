import { z } from 'zod';
import { LOCALES, type Locale } from './locale.js';

// Схемы редактирования контента в админке. Ими проверяет запрос API,
// и по ним же форма в админке показывает ошибки до отправки.

export const CONTENT_LIMITS = {
  slugMax: 64,
  shortText: 120,
  longText: 2000,
  listItem: 500,
  listMax: 30,
  stackMax: 40,
  urlMax: 500,
} as const;

/** Коды ошибок: текст подставляет форма. */
export const CONTENT_ERROR_CODES = [
  'required',
  'tooLong',
  'tooMany',
  'slugInvalid',
  'urlInvalid',
  'emailInvalid',
  'monthInvalid',
  'endBeforeStart',
  'duplicate',
] as const;
export type ContentErrorCode = (typeof CONTENT_ERROR_CODES)[number];

const text = (max: number) =>
  z.string().trim().min(1, 'required').max(max, 'tooLong');

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, 'tooLong')
    .transform((value) => value || null)
    .nullable();

/**
 * Список строк: пустые пункты выбрасываются. Форма хранит список как строки
 * textarea, и пустая строка в конце — обычное дело, пока человек печатает.
 */
const textList = (itemMax: number, listMax: number, min = 0) =>
  z
    .array(z.string().trim().max(itemMax, 'tooLong'))
    .transform((items) => items.filter(Boolean))
    .pipe(z.array(z.string()).min(min, 'required').max(listMax, 'tooMany'));

/** Стек и навыки: повторы — почти всегда опечатка. */
const uniqueList = (itemMax: number, listMax: number, min = 0) =>
  textList(itemMax, listMax, min).refine(
    (items) =>
      new Set(items.map((item) => item.toLowerCase())).size === items.length,
    'duplicate',
  );

const slug = z
  .string()
  .trim()
  .min(1, 'required')
  .max(CONTENT_LIMITS.slugMax, 'tooLong')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slugInvalid');

const httpUrl = z
  .string()
  .trim()
  .max(CONTENT_LIMITS.urlMax, 'tooLong')
  .pipe(z.url({ protocol: /^https?$/, error: 'urlInvalid' }));

const optionalUrl = z
  .string()
  .trim()
  .max(CONTENT_LIMITS.urlMax, 'tooLong')
  .transform((value) => value || null)
  .pipe(z.url({ protocol: /^https?$/, error: 'urlInvalid' }).nullable())
  .nullable();

/** Месяц YYYY-MM: на сайте опыт показан с точностью до месяца. */
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'monthInvalid');

/** Тексты на всех языках сайта: пропустить перевод нельзя. */
function localized<T extends z.ZodType>(schema: T) {
  return z.object(
    Object.fromEntries(LOCALES.map((locale) => [locale, schema])) as Record<
      Locale,
      T
    >,
  );
}

export const profileInputSchema = z.object({
  title: text(CONTENT_LIMITS.shortText),
  specialization: text(CONTENT_LIMITS.shortText),
  email: z.string().trim().pipe(z.email('emailInvalid')),
  telegramUrl: httpUrl,
  githubUrl: httpUrl,
  linkedinUrl: httpUrl,
  translations: localized(
    z.object({
      fullName: text(CONTENT_LIMITS.shortText),
      shortName: text(CONTENT_LIMITS.shortText),
      summary: text(CONTENT_LIMITS.longText),
      about: textList(CONTENT_LIMITS.longText, 10, 1),
    }),
  ),
});
export type ProfileInput = z.input<typeof profileInputSchema>;
export type ProfileData = z.output<typeof profileInputSchema>;

export const workInputSchema = z
  .object({
    slug,
    role: text(CONTENT_LIMITS.shortText),
    startDate: month,
    endDate: month.nullable(),
    stack: uniqueList(CONTENT_LIMITS.shortText, CONTENT_LIMITS.stackMax),
    translations: localized(
      z.object({
        company: optionalText(CONTENT_LIMITS.shortText),
        project: text(CONTENT_LIMITS.shortText),
        summary: text(CONTENT_LIMITS.longText),
        responsibilities: textList(
          CONTENT_LIMITS.listItem,
          CONTENT_LIMITS.listMax,
        ),
        achievements: textList(CONTENT_LIMITS.listItem, CONTENT_LIMITS.listMax),
      }),
    ),
  })
  // Строки YYYY-MM сравниваются как даты
  .refine(({ startDate, endDate }) => !endDate || endDate >= startDate, {
    message: 'endBeforeStart',
    path: ['endDate'],
  });
export type WorkInput = z.input<typeof workInputSchema>;
export type WorkData = z.output<typeof workInputSchema>;

export const PROJECT_KINDS = ['OPEN_SOURCE', 'FREELANCE'] as const;

export const projectInputSchema = z.object({
  slug,
  kind: z.enum(PROJECT_KINDS),
  stack: uniqueList(CONTENT_LIMITS.shortText, CONTENT_LIMITS.stackMax),
  repoUrl: optionalUrl,
  liveUrl: optionalUrl,
  translations: localized(
    z.object({
      name: text(CONTENT_LIMITS.shortText),
      description: text(CONTENT_LIMITS.longText),
    }),
  ),
});
export type ProjectInput = z.input<typeof projectInputSchema>;
export type ProjectData = z.output<typeof projectInputSchema>;

export const skillCategoryInputSchema = z.object({
  slug,
  translations: localized(z.object({ name: text(CONTENT_LIMITS.shortText) })),
  skills: uniqueList(CONTENT_LIMITS.shortText, 60, 1),
});
export type SkillCategoryInput = z.input<typeof skillCategoryInputSchema>;
export type SkillCategoryData = z.output<typeof skillCategoryInputSchema>;

/** Новый порядок записей: все id раздела, каждый один раз. */
export const reorderSchema = z.object({
  ids: z
    .array(z.uuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, 'duplicate'),
});
export type ReorderInput = z.infer<typeof reorderSchema>;
