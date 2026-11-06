'use client';

import {
  CONTENT_ERROR_CODES,
  LOCALES,
  type ContentErrorCode,
  type Locale,
} from '@portfolio/shared';
import { useId, type ReactNode } from 'react';
import {
  Controller,
  get,
  useFormContext,
  type FieldError,
  type RegisterOptions,
} from 'react-hook-form';
import { INPUT_CLASS } from '@/components/form-field';
import { isOneOf } from '@/lib/guards';

// Поля работают через useFormContext: форма передаёт себя через FormProvider,
// а поле берёт register и ошибки по имени, например translations.ru.summary

const ERROR_TEXT: Record<ContentErrorCode | 'slugTaken', string> = {
  required: 'Заполните поле',
  tooLong: 'Слишком длинно',
  tooMany: 'Слишком много пунктов',
  slugInvalid: 'Только латиница в нижнем регистре, цифры и дефисы',
  urlInvalid: 'Нужна ссылка, начинающаяся с http:// или https://',
  emailInvalid: 'Нужен адрес почты',
  monthInvalid: 'Месяц в формате ГГГГ-ММ',
  endBeforeStart: 'Конец раньше начала',
  duplicate: 'Есть повторы',
  slugTaken: 'Такой адрес уже занят',
};

export function errorText(code: string | undefined): string | undefined {
  if (code === undefined) return undefined;
  return isOneOf([...CONTENT_ERROR_CODES, 'slugTaken'], code)
    ? ERROR_TEXT[code]
    : 'Проверьте поле';
}

/** Ошибка поля по пути вида translations.ru.name. У массивов — ошибка списка. */
function useFieldError(name: string): string | undefined {
  const { formState } = useFormContext();
  const error = get<
    typeof formState.errors,
    (FieldError & { root?: FieldError }) | undefined
  >(formState.errors, name);
  return errorText(error?.message ?? error?.root?.message);
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error: string | undefined;
  children: (ids: {
    id: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
  }) => ReactNode;
}) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(' ');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  name,
  label,
  hint,
  type = 'text',
  placeholder,
  options,
}: {
  name: string;
  label: string;
  hint?: string;
  type?: 'text' | 'email' | 'url' | 'month';
  placeholder?: string;
  options?: RegisterOptions;
}) {
  const { register } = useFormContext();
  return (
    <Field label={label} hint={hint} error={useFieldError(name)}>
      {(ids) => (
        <input
          {...ids}
          {...register(name, options)}
          type={type}
          placeholder={placeholder}
          className={INPUT_CLASS}
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  name,
  label,
  rows = 4,
}: {
  name: string;
  label: string;
  rows?: number;
}) {
  const { register } = useFormContext();
  return (
    <Field label={label} error={useFieldError(name)}>
      {(ids) => (
        <textarea
          {...ids}
          {...register(name)}
          rows={rows}
          className={INPUT_CLASS}
        />
      )}
    </Field>
  );
}

/**
 * Список строк в одном textarea: пункт на строку. В форме хранится массив,
 * в том числе с пустыми строками, пока человек печатает: join и split дают
 * тот же текст обратно. Пустые пункты выбрасывает схема при отправке.
 */
export function ListField({
  name,
  label,
  hint = 'По одному пункту на строку',
  rows = 5,
}: {
  name: string;
  label: string;
  hint?: string;
  rows?: number;
}) {
  const { control } = useFormContext();
  const error = useFieldError(name);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Field label={label} hint={hint} error={error}>
          {(ids) => (
            <textarea
              {...ids}
              ref={field.ref}
              name={field.name}
              value={((field.value as string[] | undefined) ?? []).join('\n')}
              onChange={(event) =>
                field.onChange(event.target.value.split('\n'))
              }
              onBlur={field.onBlur}
              rows={rows}
              className={INPUT_CLASS}
            />
          )}
        </Field>
      )}
    />
  );
}

const LOCALE_LABELS: Record<Locale, string> = { ru: 'Русский', en: 'English' };

/** Перевод поля на все языки рядом: слева русский, справа английский. */
export function Localized({
  children,
}: {
  children: (locale: Locale, prefix: string) => ReactNode;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {LOCALES.map((locale) => (
        <fieldset
          key={locale}
          className="flex flex-col gap-4 rounded-sm border border-line p-4"
        >
          <legend className="px-1 text-xs tracking-wide text-muted uppercase">
            {LOCALE_LABELS[locale]}
          </legend>
          {children(locale, `translations.${locale}`)}
        </fieldset>
      ))}
    </div>
  );
}

/** Кнопка сохранения и результат последней попытки. */
export function SaveBar({
  pending,
  status,
  children,
}: {
  pending: boolean;
  status: 'saved' | 'failed' | 'invalid' | null;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-accent px-5 py-3 font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Сохраняем…' : 'Сохранить'}
      </button>
      {status === 'saved' && (
        <p role="status" className="text-sm text-muted">
          Сохранено. Страницы сайта обновятся при следующем открытии
        </p>
      )}
      {status === 'invalid' && (
        <p role="alert" className="text-sm text-accent">
          Проверьте отмеченные поля
        </p>
      )}
      {status === 'failed' && (
        <p role="alert" className="text-sm text-accent">
          Не удалось сохранить. Попробуйте ещё раз
        </p>
      )}
      {children}
    </div>
  );
}
