import createClient from 'openapi-fetch';
import type { paths } from '../api/schema';

/**
 * Клиент API админки для браузера. Запросы идут на адрес сайта (/admin/api/v1/...),
 * а прокси передаёт их в API, поэтому пути и типы те же, что у самого API.
 */
export function adminClient() {
  return createClient<paths>({ baseUrl: `${window.location.origin}/admin` });
}

/** Ответ API с ошибкой. Статус нужен, чтобы отличить «войди заново» от остального. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message = `API ответил ${status}`,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** openapi-fetch не бросает на 4xx/5xx, а TanStack Query ждёт исключение. */
export function unwrap<T>({
  data,
  response,
}: {
  data?: T;
  response: Response;
}): T {
  if (!response.ok || data === undefined) {
    throw new ApiError(response.status);
  }
  return data;
}
