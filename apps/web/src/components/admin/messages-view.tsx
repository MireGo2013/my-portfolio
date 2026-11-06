'use client';

import {
  MESSAGE_PAGE_SIZES,
  MESSAGE_STATUSES,
  type MessageSortField,
  type MessageStatus,
} from '@portfolio/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useId, useState, type ReactNode } from 'react';
import {
  filtersToApiQuery,
  hasInvalidPeriod,
  type MessageFilters,
} from '@/lib/admin/message-filters';
import {
  formatMessageDate,
  STATUS_LABELS,
  STATUS_TAB_LABELS,
} from '@/lib/admin/message-status';
import {
  fetchMessageCounts,
  fetchMessages,
  messageKeys,
  type Message,
} from '@/lib/admin/messages-api';
import {
  LIST_URL_KEY,
  useMessageFilters,
} from '@/lib/admin/use-message-filters';

const CONTROL_CLASS =
  'rounded-sm border border-line bg-surface px-3 py-2 outline-none transition-colors focus-visible:border-accent';
const BUTTON_CLASS =
  'rounded-sm border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40';

export function MessagesView() {
  const [filters, setFilters] = useMessageFilters();
  const invalidPeriod = hasInvalidPeriod(filters);
  const apiQuery = filtersToApiQuery(filters);

  const list = useQuery({
    queryKey: messageKeys.list(apiQuery),
    queryFn: ({ signal }) => fetchMessages(apiQuery, signal),
    enabled: !invalidPeriod,
    // Пока грузится новая страница, показываем старую, а не пустую таблицу
    placeholderData: keepPreviousData,
  });
  const counts = useQuery({
    queryKey: messageKeys.counts(),
    queryFn: ({ signal }) => fetchMessageCounts(signal),
  });

  // Карточка сообщения вернёт в список с этими же фильтрами
  useEffect(() => {
    try {
      sessionStorage.setItem(LIST_URL_KEY, window.location.search);
    } catch {
      // Без sessionStorage карточка просто вернёт к списку без фильтров
    }
  }, [filters]);

  // После смены статуса последняя страница могла опустеть. Смотрим только
  // на ответ для текущих фильтров: пока он грузится, list.data — это старая
  // выборка (keepPreviousData), и её число страниц сюда не относится
  const pageCount = list.isPlaceholderData ? undefined : list.data?.pageCount;
  useEffect(() => {
    if (pageCount !== undefined && filters.page > pageCount) {
      setFilters({ page: pageCount }, 'replace');
    }
  }, [pageCount, filters.page, setFilters]);

  const hasFilters = Boolean(
    filters.status || filters.q || filters.from || filters.to,
  );

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Сообщения</h1>

      <StatusTabs
        current={filters.status}
        counts={counts.data}
        onChange={(status) => setFilters({ status })}
      />

      <div className="flex flex-wrap items-end gap-4">
        <SearchBox
          value={filters.q}
          onSearch={(q) => setFilters({ q }, 'replace')}
        />
        <DateInput
          label="С"
          value={filters.from}
          max={filters.to}
          onChange={(from) => setFilters({ from })}
        />
        <DateInput
          label="По"
          value={filters.to}
          min={filters.from}
          onChange={(to) => setFilters({ to })}
        />
        {hasFilters && (
          <button
            type="button"
            className={BUTTON_CLASS}
            onClick={() =>
              setFilters({
                status: undefined,
                q: '',
                from: undefined,
                to: undefined,
              })
            }
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {invalidPeriod ? (
        <p role="alert" className="text-accent">
          Начало периода позже конца
        </p>
      ) : list.isPending ? (
        <p className="text-muted">Загружаем сообщения…</p>
      ) : list.isError ? (
        <div role="alert" className="flex items-center gap-4">
          <p className="text-accent">Не удалось загрузить сообщения</p>
          <button
            type="button"
            className={BUTTON_CLASS}
            onClick={() => void list.refetch()}
          >
            Повторить
          </button>
        </div>
      ) : list.data.items.length === 0 ? (
        <p className="text-muted">
          {hasFilters ? 'Ничего не найдено' : 'Сообщений пока нет'}
        </p>
      ) : (
        <>
          <MessagesTable
            items={list.data.items}
            filters={filters}
            onSort={(sort) =>
              setFilters({
                sort,
                // Повторный клик меняет направление. Дату удобнее
                // начинать с новых, остальное — по алфавиту
                order:
                  filters.sort === sort
                    ? filters.order === 'asc'
                      ? 'desc'
                      : 'asc'
                    : sort === 'createdAt'
                      ? 'desc'
                      : 'asc',
              })
            }
            busy={list.isFetching}
          />
          <Pagination
            page={list.data.page}
            pageCount={list.data.pageCount}
            total={list.data.total}
            pageSize={filters.pageSize}
            onPage={(page) => setFilters({ page })}
            onPageSize={(pageSize) => setFilters({ pageSize })}
          />
        </>
      )}
    </section>
  );
}

function StatusTabs({
  current,
  counts,
  onChange,
}: {
  current: MessageStatus | undefined;
  counts: Record<MessageStatus | 'total', number> | undefined;
  onChange: (status: MessageStatus | undefined) => void;
}) {
  const tabs: {
    status: MessageStatus | undefined;
    label: string;
    count?: number;
  }[] = [
    { status: undefined, label: 'Все', count: counts?.total },
    ...MESSAGE_STATUSES.map((status) => ({
      status,
      label: STATUS_TAB_LABELS[status],
      count: counts?.[status],
    })),
  ];

  return (
    <div role="group" aria-label="Статус" className="flex flex-wrap gap-2">
      {tabs.map(({ status, label, count }) => (
        <button
          key={label}
          type="button"
          aria-pressed={current === status}
          onClick={() => onChange(status)}
          className="rounded-sm border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent"
        >
          {label}
          {count !== undefined && (
            // Пробел текстом, а не отступом: так он есть и в доступном имени кнопки
            <span className="opacity-70"> {count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SearchBox({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (q: string) => void;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  // Что поле само отправило в адрес и ещё не получило обратно
  const [sent, setSent] = useState<string | null>(null);

  // Адрес сменился. Если это вернулось наше же значение, поле не трогаем:
  // пока адрес обновлялся, человек мог допечатать ещё буквы. Если значение
  // чужое (кнопка «Назад», «Сбросить фильтры»), поле следует за адресом.
  // Сравниваем прямо в рендере, а не в эффекте: так не будет кадра со старым текстом
  if (value !== prevValue) {
    setPrevValue(value);
    if (value === sent) setSent(null);
    else setText(value);
  }

  // Запрос уходит, когда пауза в наборе дольше 300 мс, а не на каждую букву
  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => {
      setSent(text);
      onSearch(text);
    }, 300);
    return () => clearTimeout(timer);
  }, [text, value, onSearch]);

  return (
    <div className="flex min-w-60 flex-1 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-muted">
        Поиск
      </label>
      <input
        id={id}
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Имя, почта или текст"
        className={CONTROL_CLASS}
      />
    </div>
  );
}

function DateInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string | undefined;
  min?: string;
  max?: string;
  onChange: (value: string | undefined) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value ?? ''}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value || undefined)}
        className={CONTROL_CLASS}
      />
    </div>
  );
}

const COLUMNS: { field: MessageSortField; label: string }[] = [
  { field: 'createdAt', label: 'Дата' },
  { field: 'name', label: 'Имя' },
  { field: 'email', label: 'Почта' },
];

function MessagesTable({
  items,
  filters,
  onSort,
  busy,
}: {
  items: Message[];
  filters: MessageFilters;
  onSort: (field: MessageSortField) => void;
  busy: boolean;
}) {
  const sortHeader = (field: MessageSortField, label: ReactNode) => {
    const active = filters.sort === field;
    return (
      <th
        key={field}
        scope="col"
        aria-sort={
          active
            ? filters.order === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none'
        }
        className="px-3 py-2 font-medium"
      >
        <button
          type="button"
          onClick={() => onSort(field)}
          className="flex items-center gap-1 hover:text-accent"
        >
          {label}
          <span aria-hidden="true" className="text-muted">
            {active ? (filters.order === 'asc' ? '↑' : '↓') : '↕'}
          </span>
        </button>
      </th>
    );
  };

  return (
    <div
      className="overflow-x-auto transition-opacity aria-busy:opacity-60"
      aria-busy={busy}
    >
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <thead className="border-b border-line text-muted">
          <tr>
            {COLUMNS.map(({ field, label }) => sortHeader(field, label))}
            <th scope="col" className="px-3 py-2 font-medium">
              Сообщение
            </th>
            {sortHeader('status', 'Статус')}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className={`border-b border-line/60 ${item.status === 'NEW' ? 'font-semibold' : ''}`}
            >
              <td className="whitespace-nowrap px-3 py-2 text-muted">
                {formatMessageDate(item.createdAt)}
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/admin/messages/${item.id}`}
                  className="underline decoration-line underline-offset-4 hover:text-accent hover:decoration-accent"
                >
                  {item.name}
                </Link>
              </td>
              <td className="px-3 py-2 break-all">{item.email}</td>
              <td className="max-w-xs px-3 py-2">
                <span className="line-clamp-1 font-normal text-muted">
                  {item.message}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2">
                {STATUS_LABELS[item.status]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize: (size: MessageFilters['pageSize']) => void;
}) {
  const id = useId();
  return (
    <nav
      aria-label="Страницы"
      className="flex flex-wrap items-center gap-4 text-sm"
    >
      <button
        type="button"
        className={BUTTON_CLASS}
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Назад
      </button>
      <span>
        Страница {page} из {pageCount} · всего {total}
      </span>
      <button
        type="button"
        className={BUTTON_CLASS}
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
      >
        Вперёд
      </button>
      <label htmlFor={id} className="ml-auto text-muted">
        На странице
      </label>
      <select
        id={id}
        value={pageSize}
        onChange={(event) =>
          onPageSize(Number(event.target.value) as MessageFilters['pageSize'])
        }
        className={CONTROL_CLASS}
      >
        {MESSAGE_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </nav>
  );
}
