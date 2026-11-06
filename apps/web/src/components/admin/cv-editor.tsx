'use client';

import { CV_LIMITS, LOCALES, type Locale } from '@portfolio/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useRef, useState } from 'react';
import { resumeUrl } from '@/i18n/config';
import {
  CvUploadFailed,
  cvKey,
  fetchCv,
  removeCvFile,
  uploadCvFile,
  type AdminCv,
  type CvUploadError,
} from '@/lib/admin/cv-api';

const LOCALE_TITLES: Record<Locale, string> = {
  ru: 'Русская версия',
  en: 'English version',
};

const ERRORS: Record<CvUploadError, string> = {
  missing: 'Выберите файл',
  tooLarge: `Файл больше ${CV_LIMITS.maxBytes / 1024 / 1024} МБ`,
  notPdf: 'Нужен файл PDF',
  storageNotConfigured:
    'Хранилище Vercel Blob не подключено. Пока на сайте резюме из сборки',
  failed: 'Не удалось загрузить. Попробуйте ещё раз',
};

const BUTTON_CLASS =
  'rounded-sm border border-line px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40';

export function CvEditor() {
  const cv = useQuery({
    queryKey: cvKey(),
    queryFn: ({ signal }) => fetchCv(signal),
  });

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Резюме</h1>
        <p className="text-sm text-muted">
          PDF для кнопок «Посмотреть» и «Скачать» на главной. Пока файл не
          загружен, сайт отдаёт резюме из сборки.
        </p>
      </header>
      {cv.isPending ? (
        <p className="text-muted">Загружаем…</p>
      ) : cv.isError ? (
        <p role="alert" className="text-accent">
          Не удалось загрузить данные о резюме
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {LOCALES.map((locale) => (
            <CvCard key={locale} locale={locale} url={cv.data[locale]} />
          ))}
        </div>
      )}
    </section>
  );
}

function CvCard({ locale, url }: { locale: Locale; url: string | null }) {
  const queryClient = useQueryClient();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState<'uploaded' | 'removed' | null>(null);

  const onSuccess = (data: AdminCv, kind: 'uploaded' | 'removed') => {
    queryClient.setQueryData(cvKey(), data);
    setDone(kind);
    setFile(null);
    if (input.current) input.current.value = '';
  };
  const upload = useMutation({
    mutationFn: (selected: File) => uploadCvFile(locale, selected),
    onSuccess: (data) => onSuccess(data, 'uploaded'),
  });
  const remove = useMutation({
    mutationFn: () => removeCvFile(locale),
    onSuccess: (data) => onSuccess(data, 'removed'),
  });

  const failure = upload.error ?? remove.error;
  const errorText =
    failure instanceof CvUploadFailed
      ? ERRORS[failure.code]
      : failure && ERRORS.failed;
  const busy = upload.isPending || remove.isPending;

  return (
    <article className="flex flex-col gap-4 rounded-sm border border-line p-4">
      <h2 className="font-medium">{LOCALE_TITLES[locale]}</h2>

      <p className="text-sm">
        {url ? 'Загруженный файл: ' : 'Файл из сборки сайта: '}
        <a
          href={url ?? resumeUrl(locale)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-line underline-offset-4 hover:text-accent"
        >
          открыть
        </a>
      </p>

      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setDone(null);
          if (file) upload.mutate(file);
        }}
      >
        <label htmlFor={inputId} className="text-sm font-medium">
          Новый PDF
        </label>
        <input
          ref={input}
          id={inputId}
          type="file"
          accept="application/pdf"
          onChange={(event) => {
            setDone(null);
            upload.reset();
            setFile(event.target.files?.[0] ?? null);
          }}
          className="text-sm file:mr-3 file:rounded-sm file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-ink"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={!file || busy}
            className="rounded-sm bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {upload.isPending ? 'Загружаем…' : 'Загрузить'}
          </button>
          {url && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setDone(null);
                remove.mutate();
              }}
              className={BUTTON_CLASS}
            >
              {remove.isPending ? 'Убираем…' : 'Вернуть файл из сборки'}
            </button>
          )}
        </div>
      </form>

      {done && (
        <p role="status" className="text-sm text-muted">
          {done === 'uploaded'
            ? 'Загружено. На сайте уже новый файл'
            : 'Готово. На сайте снова резюме из сборки'}
        </p>
      )}
      {errorText && (
        <p role="alert" className="text-sm text-accent">
          {errorText}
        </p>
      )}
    </article>
  );
}
