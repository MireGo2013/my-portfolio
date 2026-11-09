import { useId, type ReactNode } from 'react';

export const INPUT_CLASS =
  'w-full rounded-sm border border-line bg-surface px-3 py-2 outline-none transition-colors focus-visible:border-accent aria-invalid:border-accent';

/** Что поле получает от обёртки: подходит и для input, и для textarea. */
export type FieldControlProps = {
  id: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

/** Подпись, поле, подсказка и ошибка, связанные для скринридера через id. */
export function FormField({
  label,
  error,
  hint,
  labelClassName = 'font-medium',
  children,
}: {
  label: string;
  error: string | undefined;
  hint?: string;
  labelClassName?: string;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
