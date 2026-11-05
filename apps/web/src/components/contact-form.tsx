'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CONTACT_ERROR_CODES,
  contactMessageSchema,
  type ContactErrorCode,
  type ContactMessage,
} from '@portfolio/shared';
import { useId, useState, type ComponentProps } from 'react';
import { useForm, type FieldError } from 'react-hook-form';
import type { Dictionary } from '@/i18n/dictionaries/ru';
import { sendContactMessage, type SendResult } from '@/lib/api/contact-api';

const inputClass =
  'w-full rounded-sm border border-line bg-surface px-3 py-2 outline-none transition-colors focus-visible:border-accent aria-invalid:border-accent';

function isContactErrorCode(value: string): value is ContactErrorCode {
  return (CONTACT_ERROR_CODES as readonly string[]).includes(value);
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: string | undefined;
  children: (props: ComponentProps<'input'>) => React.ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
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
    formState: { errors, isSubmitting },
  } = useForm<ContactMessage>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: { name: '', email: '', message: '', website: '' },
  });

  const errorText = (error: FieldError | undefined) => {
    const code = error?.message;
    return code && isContactErrorCode(code)
      ? dictionary.errors[code]
      : undefined;
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
      <Field label={dictionary.name} error={errorText(errors.name)}>
        {(props) => (
          <input
            {...props}
            {...register('name')}
            autoComplete="name"
            className={inputClass}
          />
        )}
      </Field>

      <Field label={dictionary.email} error={errorText(errors.email)}>
        {(props) => (
          <input
            {...props}
            {...register('email')}
            type="email"
            autoComplete="email"
            className={inputClass}
          />
        )}
      </Field>

      <Field label={dictionary.message} error={errorText(errors.message)}>
        {({ id, 'aria-invalid': invalid, 'aria-describedby': describedBy }) => (
          <textarea
            id={id}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            {...register('message')}
            rows={6}
            className={inputClass}
          />
        )}
      </Field>

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
