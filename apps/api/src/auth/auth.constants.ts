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
