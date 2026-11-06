import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from './admin-client';
import { ADMIN_LOGIN } from './paths';

/**
 * 401 после того, как прокси уже попробовал обновить токен, значит,
 * сессии больше нет. Ведём на вход и возвращаем сюда же после него.
 */
function redirectOnLostSession(error: Error) {
  if (error instanceof ApiError && error.status === 401) {
    const next = window.location.pathname + window.location.search;
    // Полная перезагрузка намеренно: вместе со страницей пропадает кэш
    // TanStack Query с данными сессии, которой больше нет. Роутера здесь
    // тоже нет: это обработчик кэша, а не компонент
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- нужен сброс состояния вкладки
    window.location.assign(`${ADMIN_LOGIN}?next=${encodeURIComponent(next)}`);
  }
}

export function createAdminQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError: redirectOnLostSession }),
    mutationCache: new MutationCache({ onError: redirectOnLostSession }),
    defaultOptions: {
      queries: {
        // 30 секунд данные считаются свежими: переход между страницами
        // не делает лишних запросов
        staleTime: 30_000,
        // 4xx не исправится от повтора, а 5xx и обрыв сети могут
        retry: (failureCount, error) =>
          !(error instanceof ApiError && error.status < 500) &&
          failureCount < 2,
      },
    },
  });
}
