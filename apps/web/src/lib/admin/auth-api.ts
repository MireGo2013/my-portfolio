import type { LoginCredentials } from '@portfolio/shared';
import { adminClient } from './admin-client';

export type LoginResult =
  'ok' | 'mfa' | 'invalid' | 'rate-limited' | 'unavailable' | 'failed';

function resultOf(response: Response): Exclude<LoginResult, 'mfa'> {
  if (response.ok) return 'ok';
  if (response.status === 401) return 'invalid';
  if (response.status === 429) return 'rate-limited';
  // Прокси сайта отвечает 503, если API не отвечает вовсе
  if (response.status === 503) return 'unavailable';
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
export type CodeResult = Exclude<LoginResult, 'mfa'> | 'expired';

/**
 * Второй шаг входа. 'invalid' — неверный код, можно ввести другой.
 * 'expired' — шаг истёк, использован или исчерпал попытки: новые коды
 * бесполезны, нужно снова ввести пароль.
 */
export async function loginTotp(code: string): Promise<CodeResult> {
  try {
    const { response, error } = await adminClient().POST(
      '/api/v1/auth/login/totp',
      { body: { code } },
    );
    // 400 — код не того вида (меньше шести символов): для человека это тот же неверный код
    if (response.status === 400) return 'invalid';
    // Тело ошибки в контракте не описано, поэтому читаем его осторожно
    const body: unknown = error;
    const reason =
      typeof body === 'object' && body !== null && 'code' in body
        ? body.code
        : undefined;
    if (response.status === 401 && reason === 'mfaExpired') return 'expired';
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
