import createClient from 'openapi-fetch';
import type { components, paths } from './schema';

export type Profile = components['schemas']['ProfileDto'];
export type Experience = components['schemas']['ExperienceDto'];
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
  const client = createClient<paths>({ baseUrl });

  return {
    async getProfile(): Promise<Profile> {
      return unwrap('/profile', await client.GET('/api/v1/profile'));
    },
    async getExperience(): Promise<Experience[]> {
      return unwrap('/experience', await client.GET('/api/v1/experience'));
    },
    async getProjects(): Promise<Project[]> {
      return unwrap('/projects', await client.GET('/api/v1/projects'));
    },
    async getSkills(): Promise<SkillCategory[]> {
      return unwrap('/skills', await client.GET('/api/v1/skills'));
    },
  };
}
