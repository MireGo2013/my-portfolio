'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { contactMessageSchema, type ContactMessage } from '@portfolio/shared';
import { useId, useState, type ComponentProps } from 'react';
import { useForm, type FieldError } from 'react-hook-form';
import { sendContactMessage, type SendResult } from '@/lib/api/contact-api';

const inputClass =
  'w-full rounded-sm border border-line bg-transparent px-3 py-2 outline-none transition-colors focus-visible:border-accent aria-invalid:border-accent';

const RESULT_TEXT: Record<SendResult, string> = {
  sent: 'Сообщение отправлено. Спасибо, отвечу в ближайшее время!',
  'rate-limited':
    'Слишком много отправок с вашего адреса. Попробуйте позже или напишите напрямую.',
  failed:
    'Не удалось отправить сообщение. Попробуйте ещё раз или напишите напрямую.',
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error: FieldError | undefined;
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
          {error.message}
        </p>
      )}
    </div>
  );
}

export function ContactForm() {
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
      <Field label="Имя" error={errors.name}>
        {(props) => (
          <input
            {...props}
            {...register('name')}
            autoComplete="name"
            className={inputClass}
          />
        )}
      </Field>

      <Field label="Email" error={errors.email}>
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

      <Field label="Сообщение" error={errors.message}>
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
          Сайт
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
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </button>

        {result && (
          <p
            role={result === 'sent' ? 'status' : 'alert'}
            className={result === 'sent' ? '' : 'text-accent'}
          >
            {RESULT_TEXT[result]}
          </p>
        )}
      </div>
    </form>
  );
}
