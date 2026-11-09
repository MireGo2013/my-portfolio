import createClient from 'openapi-fetch';
import type { Locale } from '@portfolio/shared';
import type { components, paths } from '@/shared/api/schema';

export type Profile = components['schemas']['ProfileDto'];
export type Work = components['schemas']['WorkDto'];
export type Project = components['schemas']['ProjectDto'];
export type SkillCategory = components['schemas']['SkillCategoryDto'];

/**
 * openapi-fetch не бросает ошибку на ответ 4xx/5xx, а возвращает её в результате.
 * Бросаем сами: иначе на сборке страница тихо опубликуется без контента.
 */
function unwrap<T>(
  path: string,
  { data, response }: { data?: T; response: Response },
): T {
  if (data === undefined) {
    throw new Error(`GET ${path}: API ответил ${response.status}`);
  }
  return data;
}

/** Типизированный доступ к API контента. Ничего не знает про кэш и Next.js. */
export function createContentApi(baseUrl: string) {
  const client = createClient<paths>({
    baseUrl,
    // Кэшированием управляет только 'use cache' в lib/content.ts. Без no-store
    // Next.js дополнительно сохранял бы ответы в свой кэш запросов, а он
    // переживает сборки: новая сборка показала бы контент из прошлой
    fetch: (request) => fetch(request, { cache: 'no-store' }),
  });

  return {
    async getProfile(locale: Locale): Promise<Profile> {
      return unwrap(
        '/profile',
        await client.GET('/api/v1/profile', { params: { query: { locale } } }),
      );
    },
    async getWork(locale: Locale): Promise<Work[]> {
      return unwrap(
        '/work',
        await client.GET('/api/v1/work', {
          params: { query: { locale } },
        }),
      );
    },
    async getProjects(locale: Locale): Promise<Project[]> {
      return unwrap(
        '/projects',
        await client.GET('/api/v1/projects', { params: { query: { locale } } }),
      );
    },
    async getSkills(locale: Locale): Promise<SkillCategory[]> {
      return unwrap(
        '/skills',
        await client.GET('/api/v1/skills', { params: { query: { locale } } }),
      );
    },
  };
}
