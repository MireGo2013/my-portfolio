import type { LoginCredentials } from '@portfolio/shared';
import { adminClient } from './admin-client';

export type LoginResult = 'ok' | 'mfa' | 'invalid' | 'rate-limited' | 'failed';

function resultOf(response: Response): Exclude<LoginResult, 'mfa'> {
  if (response.ok) return 'ok';
  if (response.status === 401) return 'invalid';
  if (response.status === 429) return 'rate-limited';
  return 'failed';
}

/**
 * Вызывается из браузера, поэтому при любом сбое возвращает результат,
 * а не бросает. 'mfa' — пароль верный, нужен код второго фактора.
 */
export async function login(body: LoginCredentials): Promise<LoginResult> {
  try {
    const { data, response } = await adminClient().POST('/api/v1/auth/login', {
      body,
    });
    if (response.status === 200 && data?.mfaRequired) return 'mfa';
    return resultOf(response);
  } catch {
    return 'failed';
  }
}

/** Второй шаг входа: код из приложения или резервный код. */
export async function loginTotp(
  code: string,
): Promise<Exclude<LoginResult, 'mfa'>> {
  try {
    const { response } = await adminClient().POST('/api/v1/auth/login/totp', {
      body: { code },
    });
    return resultOf(response);
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
