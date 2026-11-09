'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
  filtersToSearch,
  parseMessageFilters,
  type MessageFilters,
} from './message-filters';

/** Где список сообщений: карточка возвращает в него с теми же фильтрами. */
export const LIST_URL_KEY = 'admin:messages:list';

/**
 * Фильтры из адреса и функция для их смены. Адрес меняем через History API:
 * Next.js сам обновит useSearchParams, но не пойдёт на сервер за страницей.
 */
export function useMessageFilters() {
  const params = useSearchParams();
  const filters = useMemo(
    () => parseMessageFilters(new URLSearchParams(params.toString())),
    [params],
  );

  const setFilters = useCallback(
    (patch: Partial<MessageFilters>, mode: 'push' | 'replace' = 'push') => {
      // Новый фильтр показывает другую выборку, начинаем её с первой страницы
      const next = { ...filters, page: 1, ...patch };
      const url = window.location.pathname + filtersToSearch(next);
      if (mode === 'push') window.history.pushState(null, '', url);
      else window.history.replaceState(null, '', url);
    },
    [filters],
  );

  return [filters, setFilters] as const;
}
