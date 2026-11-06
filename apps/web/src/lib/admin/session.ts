import 'server-only';
import { ADMIN_COOKIES } from '@portfolio/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { components } from '../api/schema';
import { callApi } from './api-forward';
import { ADMIN_LOGIN } from './paths';

export type AdminUser = components['schemas']['AdminUserDto'];

/**
 * Кто вошёл, по мнению API. Именно эта проверка защищает страницы: cookie
 * может быть от удалённой сессии, и только API знает, жива ли она.
 * cache() — один запрос к API на рендер, сколько бы компонентов ни спросили.
 */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const access = (await cookies()).get(ADMIN_COOKIES.access)?.value;
  if (!access) return null;

  const response = await callApi('auth/me', {
    method: 'GET',
    cookies: { access },
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) {
    throw new Error(`GET /auth/me: API ответил ${response.status}`);
  }
  return (await response.json()) as AdminUser;
});

/** Для страниц админки: без сессии ведёт на вход. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect(ADMIN_LOGIN);
  return user;
}
