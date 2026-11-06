import { minutes } from '@nestjs/throttler';

/** Токен доступа живёт недолго: его не отозвать, пока не истечёт срок. */
export const ACCESS_TOKEN_TTL_MS = minutes(15);

/** Сессия продлевается при каждом обновлении токена. */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Попыток входа с одного IP за окно. */
export const LOGIN_RATE_LIMIT = 5;
export const LOGIN_RATE_WINDOW_MS = minutes(15);

/** Минимальная длина пароля первого администратора из переменных окружения. */
export const ADMIN_PASSWORD_MIN_LENGTH = 12;

/** Метаданные с ролями, которые нужны эндпоинту. */
export const ROLES_KEY = 'roles';

/**
 * Сколько после ротации старый токен обновления ещё принимается. Хватает на
 * параллельные запросы одной вкладки и мало для того, кто украл токен.
 */
export const REFRESH_GRACE_MS = 30_000;

/** Сколько ждём код второго фактора после верного пароля. */
export const MFA_TOKEN_TTL_MS = minutes(5);

/** Попыток ввести код на один шаг входа: дальше только снова с пароля. */
export const MFA_MAX_ATTEMPTS = 5;
