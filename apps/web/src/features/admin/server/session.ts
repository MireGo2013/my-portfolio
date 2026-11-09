import 'server-only';
import { ADMIN_COOKIES } from '@portfolio/shared';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { components } from '@/shared/api/schema';
import { callApi } from './api-forward';
import {
  loginPath,
  ADMIN_PATH_HEADER,
  ADMIN_SESSION_REFRESH,
  safeNextPath,
} from '@/features/admin/shell/paths';

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

/**
 * Для страниц админки. Без живой сессии сначала пробуем обновить токен:
 * он мог истечь чуть раньше cookie. Не вышло — на вход, и после входа
 * обратно на эту же страницу.
 */
export async function requireAdmin(): Promise<AdminUser> {
  // Данные запроса читаем первыми, до похода в API. Иначе Next.js в dev
  // ругается на нестабильные значения при пререндере: страница становится
  // динамической не сразу, а после чужого await
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const user = await getAdminUser();
  if (user) return user;

  const next = safeNextPath(headerStore.get(ADMIN_PATH_HEADER));
  redirect(
    cookieStore.has(ADMIN_COOKIES.refresh)
      ? `${ADMIN_SESSION_REFRESH}?${new URLSearchParams({ next })}`
      : loginPath(next),
  );
}
