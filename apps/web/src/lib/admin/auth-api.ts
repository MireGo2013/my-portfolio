import type { LoginCredentials } from '@portfolio/shared';
import { adminClient } from './admin-client';

export type LoginResult = 'ok' | 'invalid' | 'rate-limited' | 'failed';

/** Вызывается из браузера, поэтому при любом сбое возвращает результат, а не бросает. */
export async function login(body: LoginCredentials): Promise<LoginResult> {
  try {
    const { response } = await adminClient().POST('/api/v1/auth/login', {
      body,
    });
    if (response.ok) return 'ok';
    if (response.status === 401) return 'invalid';
    if (response.status === 429) return 'rate-limited';
    return 'failed';
  } catch {
    return 'failed';
  }
}

/** Выход всегда «удаётся»: даже если API недоступен, ведём на страницу входа. */
export async function logout(): Promise<void> {
  try {
    await adminClient().POST('/api/v1/auth/logout');
  } catch {
    // Сессия истечёт сама, а cookie токена доступа живёт 15 минут
  }
}
