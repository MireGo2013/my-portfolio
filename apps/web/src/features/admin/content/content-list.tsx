'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import {
  contentKeys,
  sections,
  type ListSection,
} from '@/features/admin/content/content-api';
import { CONTENT_PATHS } from '@/features/admin/shell/paths';

const BUTTON_CLASS =
  'rounded-sm border border-line px-2.5 py-1 text-sm transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40';

type Item = { id: string };

/** Что показать в строке списка: у каждого раздела свои поля. */
export type Describe<T> = (item: T) => { title: string; subtitle?: string };

export function ContentList<S extends ListSection>({
  section,
  title,
  description,
  describe,
}: {
  section: S;
  title: string;
  description: string;
  describe: Describe<Awaited<ReturnType<(typeof sections)[S]['list']>>[number]>;
}) {
  const api = sections[section];
  const basePath = CONTENT_PATHS[section];
  const queryClient = useQueryClient();
  const listKey = contentKeys.list(section);

  const list = useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) => api.list(signal) as Promise<Item[]>,
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => api.reorder(ids) as Promise<Item[]>,
    // Оптимистично: строка переезжает сразу, а при ошибке возвращается
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Item[]>(listKey);
      if (previous) {
        const byId = new Map(previous.map((item) => [item.id, item]));
        queryClient.setQueryData(
          listKey,
          ids.map((id) => byId.get(id)).filter(Boolean),
        );
      }
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous)
        queryClient.setQueryData(listKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: contentKeys.item(section, id) });
      return queryClient.invalidateQueries({ queryKey: listKey });
    },
  });

  const move = (index: number, shift: -1 | 1) => {
    const ids = (list.data ?? []).map((item) => item.id);
    const target = index + shift;
    const [moved] = ids.splice(index, 1);
    if (moved === undefined) return;
    ids.splice(target, 0, moved);
    reorder.mutate(ids);
  };

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted">{description}</p>
        </div>
        <Link
          href={`${basePath}/new`}
          className="rounded-sm bg-accent px-4 py-2 font-medium text-on-accent transition-opacity hover:opacity-90"
        >
          Добавить
        </Link>
      </header>

      {list.isPending ? (
        <p className="text-muted">Загружаем…</p>
      ) : list.isError ? (
        <p role="alert" className="text-accent">
          Не удалось загрузить список
        </p>
      ) : list.data.length === 0 ? (
        <p className="text-muted">Записей пока нет</p>
      ) : (
        <ol className="flex flex-col divide-y divide-line/60 border-y border-line/60">
          {list.data.map((item, index) => {
            const { title: itemTitle, subtitle } = describe(item as never);
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 flex-col">
                  <Link
                    href={`${basePath}/${item.id}`}
                    className="font-medium underline decoration-line underline-offset-4 hover:text-accent hover:decoration-accent"
                  >
                    {itemTitle}
                  </Link>
                  {subtitle && (
                    <span className="text-sm text-muted">{subtitle}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={BUTTON_CLASS}
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => move(index, -1)}
                    aria-label={`Выше: ${itemTitle}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={BUTTON_CLASS}
                    disabled={
                      index === list.data.length - 1 || reorder.isPending
                    }
                    onClick={() => move(index, 1)}
                    aria-label={`Ниже: ${itemTitle}`}
                  >
                    ↓
                  </button>
                  <DeleteButton
                    label={itemTitle}
                    pending={remove.isPending && remove.variables === item.id}
                    onConfirm={() => remove.mutate(item.id)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {(reorder.isError || remove.isError) && (
        <p role="alert" className="text-sm text-accent">
          {reorder.isError
            ? 'Не удалось сохранить порядок'
            : 'Не удалось удалить запись'}
        </p>
      )}
    </section>
  );
}

/**
 * Удаление в два шага прямо в строке, без модального окна браузера:
 * первый клик спрашивает, второй удаляет.
 */
function DeleteButton({
  label,
  pending,
  onConfirm,
}: {
  label: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={() => setAsking(true)}
        aria-label={`Удалить: ${label}`}
      >
        Удалить
      </button>
    );
  }

  return (
    <span
      className="flex items-center gap-2"
      role="group"
      aria-label={`Удалить «${label}»?`}
    >
      <button
        type="button"
        className={`${BUTTON_CLASS} border-accent text-accent`}
        disabled={pending}
        onClick={onConfirm}
      >
        {pending ? 'Удаляем…' : 'Да, удалить'}
      </button>
      <button
        type="button"
        className={BUTTON_CLASS}
        disabled={pending}
        onClick={() => setAsking(false)}
      >
        Отмена
      </button>
    </span>
  );
}
