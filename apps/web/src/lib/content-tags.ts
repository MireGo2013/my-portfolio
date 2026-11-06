/**
 * Метки кэша публичного контента. Страницы сайта помечают ими данные
 * ('use cache' + cacheTag), а прокси админки сбрасывает их после сохранения.
 * Ключ — раздел API админки: /admin/content/<ключ>.
 */
export const CONTENT_TAGS = {
  profile: 'profile',
  experience: 'experience',
  projects: 'projects',
  skills: 'skills',
} as const;

export type ContentSection = keyof typeof CONTENT_TAGS;

export function isContentSection(value: string): value is ContentSection {
  return Object.hasOwn(CONTENT_TAGS, value);
}
