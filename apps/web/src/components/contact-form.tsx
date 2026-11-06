'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CONTACT_ERROR_CODES,
  contactMessageSchema,
  type ContactErrorCode,
  type ContactMessage,
} from '@portfolio/shared';
import { useState } from 'react';
import { useForm, type FieldError } from 'react-hook-form';
import { FormField, INPUT_CLASS } from '@/components/form-field';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { isOneOf } from '@/lib/guards';
import { sendContactMessage, type SendResult } from '@/lib/api/contact-api';

function isContactErrorCode(value: string): value is ContactErrorCode {
  return isOneOf(CONTACT_ERROR_CODES, value);
}

export function ContactForm({
  dictionary,
}: {
  dictionary: Dictionary['contact']['form'];
}) {
  const [result, setResult] = useState<SendResult | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessage>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: { name: '', email: '', message: '', website: '' },
  });

  // Схема и так обрезает пробелы перед отправкой, а здесь их убираем и в самом
  // поле, когда фокус уходит, чтобы посетитель видел то, что уйдёт на сервер
  const trimField = (name: 'name' | 'email' | 'message') => {
    const value = getValues(name);
    const trimmed = value.trim();
    if (trimmed !== value) {
      setValue(name, trimmed);
    }
  };

  const errorText = (error: FieldError | undefined) => {
    if (!error) return undefined;
    const code = error.message;
    // Ошибка без нашего кода тоже должна что-то сказать, а не только подсветить поле
    return code && isContactErrorCode(code)
      ? dictionary.errors[code]
      : dictionary.invalidField;
  };

  const onSubmit = async (values: ContactMessage) => {
    setResult(null);
    const sendResult = await sendContactMessage(
      process.env.NEXT_PUBLIC_API_URL ?? '',
      values,
    );
    setResult(sendResult);
    if (sendResult === 'sent') {
      reset();
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      className="relative flex max-w-xl flex-col gap-5"
    >
      <FormField label={dictionary.name} error={errorText(errors.name)}>
        {(props) => (
          <input
            {...props}
            {...register('name', { onBlur: () => trimField('name') })}
            autoComplete="name"
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField label={dictionary.email} error={errorText(errors.email)}>
        {(props) => (
          <input
            {...props}
            {...register('email', { onBlur: () => trimField('email') })}
            type="email"
            autoComplete="email"
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField label={dictionary.message} error={errorText(errors.message)}>
        {({ id, 'aria-invalid': invalid, 'aria-describedby': describedBy }) => (
          <textarea
            id={id}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            {...register('message', {
              onBlur: () => trimField('message'),
            })}
            rows={6}
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      {/* Honeypot: убран за экран, а не через display:none, который боты распознают */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          {dictionary.honeypot}
          <input
            {...register('website')}
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="flex flex-col items-start gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-sm bg-accent px-5 py-3 font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? dictionary.sending : dictionary.submit}
        </button>

        {result && (
          <p
            role={result === 'sent' ? 'status' : 'alert'}
            className={result === 'sent' ? '' : 'text-accent'}
          >
            {dictionary.results[result]}
          </p>
        )}
      </div>
    </form>
  );
}
