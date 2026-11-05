import { z } from 'zod';

export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 100,
  emailMax: 254,
  messageMin: 10,
  messageMax: 5000,
  honeypotMax: 200,
} as const;

/** Одна схема для формы на клиенте и для проверки на сервере. */
export const contactMessageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.nameMin, 'Укажите имя: минимум 2 символа')
    .max(CONTACT_LIMITS.nameMax, 'Слишком длинное имя: максимум 100 символов'),
  email: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.emailMax, 'Слишком длинный адрес')
    .pipe(z.email('Укажите корректный email')),
  message: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.messageMin, 'Напишите сообщение: минимум 10 символов')
    .max(
      CONTACT_LIMITS.messageMax,
      'Слишком длинное сообщение: максимум 5000 символов',
    ),
  /**
   * Honeypot: человек поле не видит и оставляет пустым, а бот заполняет.
   * Специально без ошибки валидации, чтобы бот не понял, что его раскрыли.
   */
  website: z.string().trim().max(CONTACT_LIMITS.honeypotMax).optional(),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;
