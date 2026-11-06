import { z } from 'zod';

/** Статусы сообщения. Порядок задаёт и порядок вкладок в админке. */
export const MESSAGE_STATUSES = [
  'NEW',
  'READ',
  'REPLIED',
  'ARCHIVED',
  'SPAM',
] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const MESSAGE_SORT_FIELDS = [
  'createdAt',
  'name',
  'email',
  'status',
] as const;
export type MessageSortField = (typeof MESSAGE_SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export const MESSAGE_PAGE_SIZES = [10, 20, 50] as const;

export const MESSAGES_QUERY_LIMITS = {
  searchMax: 200,
} as const;

/**
 * Параметры списка сообщений в API. Из адреса всё приходит строками,
 * поэтому числа приводятся через coerce, а пустые строки считаются отсутствием.
 *
 * Границы периода — моменты времени с часовым поясом: что считать «днём»,
 * решает браузер автора, а не сервер в UTC. from включительно, to — нет.
 */
export const messagesQuerySchema = z
  .object({
    status: z.enum(MESSAGE_STATUSES).optional(),
    q: z
      .string()
      .trim()
      .max(MESSAGES_QUERY_LIMITS.searchMax)
      .optional()
      .transform((value) => value || undefined),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
    sort: z.enum(MESSAGE_SORT_FIELDS).default('createdAt'),
    order: z.enum(SORT_ORDERS).default('desc'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .refine((size) =>
        (MESSAGE_PAGE_SIZES as readonly number[]).includes(size),
      )
      .default(20),
  })
  .refine(({ from, to }) => !from || !to || new Date(from) < new Date(to), {
    message: 'Начало периода позже конца',
    path: ['to'],
  });

export type MessagesQuery = z.infer<typeof messagesQuerySchema>;

export const updateMessageStatusSchema = z.object({
  status: z.enum(MESSAGE_STATUSES),
});

export type UpdateMessageStatus = z.infer<typeof updateMessageStatusSchema>;
