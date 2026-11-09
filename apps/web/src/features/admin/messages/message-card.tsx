'use client';

import { MESSAGE_STATUSES, type MessageStatus } from '@portfolio/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { ApiError } from '@/features/admin/shell/admin-client';
import {
  formatMessageDate,
  STATUS_LABELS,
} from '@/features/admin/messages/message-status';
import {
  fetchMessage,
  messageKeys,
  updateMessageStatus,
  type Message,
} from '@/features/admin/messages/messages-api';
import { ADMIN_MESSAGES } from '@/features/admin/shell/paths';
import { LIST_URL_KEY } from '@/features/admin/messages/use-message-filters';

/** Длинная цитата раздула бы адрес mailto:, а почтовые программы его режут. */
const QUOTE_MAX = 1500;

function replyHref({ email, message }: Message): string {
  const quoted = message.slice(0, QUOTE_MAX);
  const body = `\n\n> ${quoted.split('\n').join('\n> ')}`;
  const params = new URLSearchParams({
    subject: 'Re: ваше сообщение с сайта',
    body,
  });
  // URLSearchParams кодирует пробел как «+», а почтовые программы ждут %20
  return `mailto:${email}?${params.toString().replaceAll('+', '%20')}`;
}

function readListSearch(): string {
  try {
    return sessionStorage.getItem(LIST_URL_KEY) ?? '';
  } catch {
    // Без sessionStorage вернёмся к списку без фильтров
    return '';
  }
}

/**
 * Адрес списка с фильтрами, с которыми его оставили. sessionStorage есть только
 * в браузере: на сервере берём список без фильтров, а React подставит
 * сохранённый адрес после гидратации, без лишнего setState в эффекте.
 */
function useBackHref(): string {
  const search = useSyncExternalStore(
    // Значение меняет только страница списка, пока карточка открыта — никто
    () => () => undefined,
    readListSearch,
    () => '',
  );
  return ADMIN_MESSAGES + search;
}

export function MessageCard() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const backHref = useBackHref();

  const message = useQuery({
    queryKey: messageKeys.item(id),
    queryFn: ({ signal }) => fetchMessage(id, signal),
  });

  const status = useMutation({
    mutationFn: (next: MessageStatus) => updateMessageStatus(id, next),
    onSuccess: (updated) => {
      // Карточка обновляется сразу из ответа, а список и счётчики
      // перезапросятся, когда понадобятся
      queryClient.setQueryData(messageKeys.item(id), updated);
      void queryClient.invalidateQueries({
        queryKey: [...messageKeys.all, 'list'],
      });
      void queryClient.invalidateQueries({ queryKey: messageKeys.counts() });
    },
  });

  // Открыл новое сообщение — значит, прочитал. Один раз, даже если
  // эффект сработает повторно (StrictMode в разработке вызывает его дважды)
  const markedAsRead = useRef(false);
  const { mutate } = status;
  useEffect(() => {
    if (message.data?.status === 'NEW' && !markedAsRead.current) {
      markedAsRead.current = true;
      mutate('READ');
    }
  }, [message.data?.status, mutate]);

  const back = (
    <Link
      href={backHref}
      className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-accent"
    >
      ← К списку
    </Link>
  );

  if (message.isPending) {
    return (
      <section className="flex flex-col gap-4">
        {back}
        <p className="text-muted">Загружаем сообщение…</p>
      </section>
    );
  }

  if (message.isError) {
    const notFound =
      message.error instanceof ApiError &&
      (message.error.status === 404 || message.error.status === 400);
    return (
      <section className="flex flex-col gap-4">
        {back}
        <p role="alert" className="text-accent">
          {notFound ? 'Сообщение не найдено' : 'Не удалось загрузить сообщение'}
        </p>
      </section>
    );
  }

  const data = message.data;

  return (
    <article className="flex max-w-3xl flex-col gap-6">
      {back}

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{data.name}</h1>
        <a
          href={`mailto:${data.email}`}
          className="w-fit underline decoration-line underline-offset-4 hover:text-accent"
        >
          {data.email}
        </a>
        <p className="text-sm text-muted">
          {formatMessageDate(data.createdAt)}
        </p>
      </header>

      <p className="whitespace-pre-wrap rounded-sm border border-line bg-surface p-4">
        {data.message}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <a
          href={replyHref(data)}
          className="rounded-sm bg-accent px-5 py-3 font-medium text-on-accent transition-opacity hover:opacity-90"
        >
          Ответить письмом
        </a>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm text-muted">Статус</h2>
        <div role="group" aria-label="Статус" className="flex flex-wrap gap-2">
          {MESSAGE_STATUSES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={data.status === value}
              disabled={status.isPending}
              onClick={() => status.mutate(value)}
              className="rounded-sm border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent disabled:opacity-60 aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-on-accent"
            >
              {STATUS_LABELS[value]}
            </button>
          ))}
        </div>
        {status.isError && (
          <p role="alert" className="text-sm text-accent">
            Не удалось сменить статус
          </p>
        )}
      </div>
    </article>
  );
}
