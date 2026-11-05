import createClient from 'openapi-fetch';
import type { components, paths } from './schema';

export type Profile = components['schemas']['ProfileDto'];

/** Типизированный доступ к API контента. Ничего не знает про кэш и Next.js. */
export function createContentApi(baseUrl: string) {
  const client = createClient<paths>({ baseUrl });

  return {
    async getProfile(): Promise<Profile> {
      const { data, response } = await client.GET('/api/v1/profile');
      if (!data) {
        throw new Error(`GET /profile: API ответил ${response.status}`);
      }
      return data;
    },
  };
}
