import { z } from 'zod';

export const AUTH_LIMITS = {
  emailMax: 254,
  // Длинный пароль хешировать дольше: верхняя граница не даёт этим злоупотребить
  passwordMax: 256,
} as const;

/** Cookie сессии админки. Нужны и API, и сайту, который проверяет вход. */
export const ADMIN_COOKIES = {
  access: 'admin_access',
  refresh: 'admin_refresh',
  /** Пароль верный, ждём код второго фактора. Живёт 5 минут */
  mfa: 'admin_mfa',
} as const;

export const LOGIN_ERROR_CODES = [
  'emailTooLong',
  'emailInvalid',
  'passwordRequired',
  'passwordTooLong',
] as const;

export type LoginErrorCode = (typeof LOGIN_ERROR_CODES)[number];

/** Форма входа в админку: одна схема для формы и для API. */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(AUTH_LIMITS.emailMax, 'emailTooLong')
    .pipe(z.email('emailInvalid')),
  // Пароль не обрезаем: пробел может быть его частью
  password: z
    .string()
    .min(1, 'passwordRequired')
    .max(AUTH_LIMITS.passwordMax, 'passwordTooLong'),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

/**
 * Код второго фактора: шесть цифр из приложения или резервный код
 * вида ABCD-EFGH-JK. Регистр, пробелы и дефисы не важны.
 */
export const totpCodeSchema = z.object({
  code: z.string().trim().min(6, 'codeInvalid').max(20, 'codeInvalid'),
});

export type TotpCode = z.infer<typeof totpCodeSchema>;
