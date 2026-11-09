'use client';

import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useState } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { ApiError } from '@/features/admin/shell/admin-client';

export type SaveStatus = 'saved' | 'failed' | 'invalid' | null;

/**
 * Поле формы для пути ошибки из API. API называет поля полным путём:
 * translations.ru.summary. Ошибка пункта списка приходит как stack.2,
 * а в форме весь список — одно поле stack, поэтому номер пункта отбрасываем.
 */
export function fieldOf(path: string): string {
  return path.replace(/(\.\d+)+$/, '');
}

/**
 * Отправка формы контента. Проверка Zod уже прошла на клиенте, но сервер
 * проверяет всё заново и может ответить 409 «slug занят» — такую ошибку
 * показываем у поля, как обычную ошибку валидации.
 */
export function useSave<TInput extends FieldValues, TOutput, TResult>(
  form: UseFormReturn<TInput, unknown, TOutput>,
  {
    save,
    invalidate,
    onSaved,
    initialStatus = null,
  }: {
    save: (values: TOutput) => Promise<TResult>;
    invalidate: QueryKey[];
    onSaved?: (result: TResult) => void;
    /** Результат, который надо показать сразу: например, после создания записи. */
    initialStatus?: SaveStatus;
  },
) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SaveStatus>(initialStatus);

  const mutation = useMutation({
    mutationFn: save,
    onSuccess: (result) => {
      setStatus('saved');
      for (const queryKey of invalidate) {
        void queryClient.invalidateQueries({ queryKey });
      }
      onSaved?.(result);
    },
    onError: (error) => {
      if (
        error instanceof ApiError &&
        (error.status === 400 || error.status === 409)
      ) {
        for (const [path, codes] of Object.entries(error.fieldErrors)) {
          form.setError(fieldOf(path) as never, { message: codes?.[0] });
        }
        setStatus('invalid');
        return;
      }
      setStatus('failed');
    },
  });

  const onSubmit = form.handleSubmit(
    (values) => {
      setStatus(null);
      mutation.mutate(values);
    },
    () => setStatus('invalid'),
  );

  return { onSubmit, pending: mutation.isPending, status };
}
