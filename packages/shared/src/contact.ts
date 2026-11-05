import { z } from 'zod';

export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 100,
  emailMax: 254,
  messageMin: 10,
  messageMax: 5000,
  honeypotMax: 200,
} as const;

/** Коды ошибок: текст на нужном языке подставляет тот, кто их показывает. */
export const CONTACT_ERROR_CODES = [
  'nameTooShort',
  'nameTooLong',
  'emailTooLong',
  'emailInvalid',
  'messageTooShort',
  'messageTooLong',
] as const;

export type ContactErrorCode = (typeof CONTACT_ERROR_CODES)[number];

/** Одна схема для формы на клиенте и для проверки на сервере. */
export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.nameMin, 'nameTooShort')
    .max(CONTACT_LIMITS.nameMax, 'nameTooLong'),
  email: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.emailMax, 'emailTooLong')
    .pipe(z.email('emailInvalid')),
  message: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.messageMin, 'messageTooShort')
    .max(CONTACT_LIMITS.messageMax, 'messageTooLong'),
  /**
   * Honeypot: человек поле не видит и оставляет пустым, а бот заполняет.
   * Специально без ошибки валидации, чтобы бот не понял, что его раскрыли.
   */
  website: z.string().trim().max(CONTACT_LIMITS.honeypotMax).optional(),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;
