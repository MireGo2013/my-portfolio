import createClient from 'openapi-fetch';
import type { paths } from '@/shared/api/schema';

/**
 * Клиент API админки для браузера. Запросы идут на адрес сайта (/admin/api/v1/...),
 * а прокси передаёт их в API, поэтому пути и типы те же, что у самого API.
 */
export function adminClient() {
  return createClient<paths>({ baseUrl: `${window.location.origin}/admin` });
}

/** Ошибки по полям в ответах 400 и 409: { slug: ['slugTaken'] }. */
export type FieldErrors = Record<string, string[] | undefined>;

/** Ответ API с ошибкой. Статус нужен, чтобы отличить «войди заново» от остального. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(`API ответил ${status}`);
    this.name = 'ApiError';
  }
}

function fieldErrorsOf(body: unknown): FieldErrors {
  if (typeof body === 'object' && body !== null && 'errors' in body) {
    const { errors } = body;
    if (typeof errors === 'object' && errors !== null) {
      return errors as FieldErrors;
    }
  }
  return {};
}

/** openapi-fetch не бросает на 4xx/5xx, а TanStack Query ждёт исключение. */
export function unwrap<T>({
  data,
  error,
  response,
}: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (!response.ok || data === undefined) {
    throw new ApiError(response.status, fieldErrorsOf(error));
  }
  return data;
}

/** Для ответов без тела (204): проверяем только статус. */
export function unwrapEmpty({
  error,
  response,
}: {
  error?: unknown;
  response: Response;
}): void {
  if (!response.ok) {
    throw new ApiError(response.status, fieldErrorsOf(error));
  }
}
