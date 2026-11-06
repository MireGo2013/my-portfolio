import {
  MESSAGE_PAGE_SIZES,
  MESSAGE_SORT_FIELDS,
  MESSAGE_STATUSES,
  MESSAGES_QUERY_LIMITS,
  SORT_ORDERS,
} from '@portfolio/shared';
import { z } from 'zod';
import type { MessagesApiQuery } from './messages-api';

/**
 * Фильтры таблицы живут в адресе: ?status=NEW&q=анна&page=2.
 * Так работает «Назад», а ссылку на выборку можно сохранить.
 *
 * Адрес может набрать руками кто угодно, поэтому каждое поле разбирается
 * отдельно, и неверное значение заменяется значением по умолчанию, а не ломает страницу.
 */
const filtersSchema = z.object({
  status: z.enum(MESSAGE_STATUSES).optional().catch(undefined),
  q: z.string().max(MESSAGES_QUERY_LIMITS.searchMax).catch('').default(''),
  // Дни в адресе — YYYY-MM-DD, как у <input type="date">
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  sort: z.enum(MESSAGE_SORT_FIELDS).catch('createdAt'),
  order: z.enum(SORT_ORDERS).catch('desc'),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .pipe(z.union(MESSAGE_PAGE_SIZES.map((size) => z.literal(size))))
    .catch(20),
});

export type MessageFilters = z.infer<typeof filtersSchema>;

export const DEFAULT_FILTERS: MessageFilters = filtersSchema.parse({});

/** Порядок параметров в адресе. Необязательных полей нет в DEFAULT_FILTERS. */
const URL_KEYS = Object.keys(filtersSchema.shape) as (keyof MessageFilters)[];

export function parseMessageFilters(params: URLSearchParams): MessageFilters {
  return filtersSchema.parse(Object.fromEntries(params));
}

/** Строка запроса без значений по умолчанию: адрес остаётся коротким. */
export function filtersToSearch(filters: MessageFilters): string {
  const params = new URLSearchParams();
  for (const key of URL_KEYS) {
    const value = filters[key];
    if (value !== undefined && value !== '' && value !== DEFAULT_FILTERS[key]) {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return search ? `?${search}` : '';
}

/** Полночь дня YYYY-MM-DD по часам браузера. */
function localMidnight(day: string, addDays = 0): Date {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  return new Date(year, month - 1, date + addDays);
}

/** «С» позже «по»: запрос не отправляем, а показываем подсказку. */
export function hasInvalidPeriod({ from, to }: MessageFilters): boolean {
  return Boolean(from && to && from > to);
}

/**
 * Параметры для API. Дни переводятся в моменты времени по часам браузера:
 * «по 5 ноября» значит «раньше полуночи 6 ноября», поэтому to сдвигается на день.
 */
export function filtersToApiQuery(filters: MessageFilters): MessagesApiQuery {
  return {
    status: filters.status,
    q: filters.q.trim() || undefined,
    from: filters.from ? localMidnight(filters.from).toISOString() : undefined,
    to: filters.to ? localMidnight(filters.to, 1).toISOString() : undefined,
    sort: filters.sort,
    order: filters.order,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}
