'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/admin/admin-client';
import {
  contentKeys,
  sections,
  type ListSection,
} from '@/lib/admin/content-api';
import { CONTENT_PATHS } from '@/lib/admin/paths';

type SectionRecord<S extends ListSection> = Awaited<
  ReturnType<(typeof sections)[S]['get']>
>;

/**
 * Страница записи: новая (id нет) или существующая. Загружает запись и отдаёт
 * её форме уже готовой: defaultValues в React Hook Form читаются один раз,
 * поэтому форму рисуем только после загрузки.
 */
export function ContentEditor<S extends ListSection>({
  section,
  id,
  title,
  children,
}: {
  section: S;
  id: string | undefined;
  title: (record: SectionRecord<S> | undefined) => string;
  children: (record: SectionRecord<S> | undefined) => ReactNode;
}) {
  const record = useQuery({
    queryKey: contentKeys.item(section, id ?? 'new'),
    queryFn: ({ signal }) =>
      sections[section].get(id ?? '', signal) as Promise<SectionRecord<S>>,
    enabled: id !== undefined,
  });

  const back = (
    <Link
      href={CONTENT_PATHS[section]}
      className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-accent"
    >
      ← К списку
    </Link>
  );

  if (id !== undefined && record.isPending) {
    return (
      <section className="flex flex-col gap-4">
        {back}
        <p className="text-muted">Загружаем…</p>
      </section>
    );
  }

  if (id !== undefined && record.isError) {
    const missing =
      record.error instanceof ApiError &&
      (record.error.status === 404 || record.error.status === 400);
    return (
      <section className="flex flex-col gap-4">
        {back}
        <p role="alert" className="text-accent">
          {missing ? 'Запись не найдена' : 'Не удалось загрузить запись'}
        </p>
      </section>
    );
  }

  const data = id === undefined ? undefined : record.data;
  return (
    <section className="flex flex-col gap-6">
      {back}
      <h1 className="text-2xl font-semibold">{title(data)}</h1>
      {/* key: при переходе с одной записи на другую форма собирается заново */}
      <div key={id ?? 'new'}>{children(data)}</div>
    </section>
  );
}
