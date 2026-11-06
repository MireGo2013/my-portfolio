import { useId, type ComponentProps, type ReactNode } from 'react';

export const INPUT_CLASS =
  'w-full rounded-sm border border-line bg-surface px-3 py-2 outline-none transition-colors focus-visible:border-accent aria-invalid:border-accent';

/** Подпись, поле и ошибка, связанные для скринридера через id. */
export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error: string | undefined;
  children: (props: ComponentProps<'input'>) => ReactNode;
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
