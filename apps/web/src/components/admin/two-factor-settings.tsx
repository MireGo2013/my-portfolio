'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toDataURL } from 'qrcode';
import { useEffect, useId, useState } from 'react';
import { INPUT_CLASS } from '@/components/form-field';
import { ApiError } from '@/lib/admin/admin-client';
import {
  disableTwoFactor,
  enableTwoFactor,
  fetchTwoFactorStatus,
  startTwoFactorSetup,
  twoFactorKey,
  type TwoFactorSetup,
} from '@/lib/admin/security-api';

const BUTTON_CLASS =
  'self-start rounded-sm bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50';
const LINK_BUTTON_CLASS =
  'self-start text-sm text-muted underline decoration-line underline-offset-4 hover:text-accent';

const codeError = (error: unknown) =>
  error instanceof ApiError && error.status === 400
    ? 'Неверный код. Проверьте время на телефоне и попробуйте ещё раз'
    : 'Не получилось. Попробуйте ещё раз';

export function TwoFactorSettings() {
  const status = useQuery({
    queryKey: twoFactorKey(),
    queryFn: ({ signal }) => fetchTwoFactorStatus(signal),
  });
  // Коды показываем один раз сразу после включения: в базе их уже не прочитать
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Безопасность</h1>
        <p className="text-sm text-muted">
          Второй фактор: после пароля админка спросит шестизначный код из
          приложения-аутентификатора (Google Authenticator, 1Password, Aegis).
        </p>
      </header>

      {backupCodes ? (
        <BackupCodes codes={backupCodes} onDone={() => setBackupCodes(null)} />
      ) : status.isPending ? (
        <p className="text-muted">Загружаем…</p>
      ) : status.isError ? (
        <p role="alert" className="text-accent">
          Не удалось загрузить настройки
        </p>
      ) : status.data.enabled ? (
        <Enabled backupCodesLeft={status.data.backupCodesLeft} />
      ) : (
        <Setup onEnabled={setBackupCodes} />
      )}
    </section>
  );
}

function CodeInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div className="flex max-w-xs flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="one-time-code"
        maxLength={20}
        className={INPUT_CLASS}
      />
    </div>
  );
}

function Setup({ onEnabled }: { onEnabled: (codes: string[]) => void }) {
  const queryClient = useQueryClient();
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');

  const start = useMutation({
    mutationFn: startTwoFactorSetup,
    onSuccess: setSetup,
  });
  const enable = useMutation({
    mutationFn: () => enableTwoFactor(code.trim()),
    onSuccess: (codes) => {
      onEnabled(codes);
      void queryClient.invalidateQueries({ queryKey: twoFactorKey() });
    },
    onError: () => setCode(''),
  });

  if (!setup) {
    return (
      <div className="flex flex-col gap-3">
        <p>Второй фактор выключен: войти можно одним паролем.</p>
        <button
          type="button"
          className={BUTTON_CLASS}
          disabled={start.isPending}
          onClick={() => start.mutate()}
        >
          {start.isPending ? 'Готовим…' : 'Подключить'}
        </button>
        {start.isError && (
          <p role="alert" className="text-sm text-accent">
            Не удалось начать подключение
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (code.trim()) enable.mutate();
      }}
    >
      <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
        <li>Отсканируйте QR-код приложением-аутентификатором.</li>
        <li>
          Введите код, который оно покажет: так мы проверим, что всё совпало.
        </li>
      </ol>
      <QrCode value={setup.otpauthUrl} />
      <p className="text-sm text-muted">
        Не сканируется? Введите ключ вручную:{' '}
        <code className="font-mono break-all text-ink">{setup.secret}</code>
      </p>
      <CodeInput value={code} onChange={setCode} label="Код из приложения" />
      <button
        type="submit"
        className={BUTTON_CLASS}
        disabled={enable.isPending || !code.trim()}
      >
        {enable.isPending ? 'Проверяем…' : 'Включить'}
      </button>
      {enable.isError && (
        <p role="alert" className="text-sm text-accent">
          {codeError(enable.error)}
        </p>
      )}
    </form>
  );
}

/** QR рисуем в браузере: секрет не уходит ни в какой сторонний сервис. */
function QrCode({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    toDataURL(value, { margin: 1, width: 200 }).then(
      (url) => {
        if (!cancelled) setSrc(url);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (failed) {
    return (
      <p role="alert" className="text-sm text-accent">
        Не удалось нарисовать QR-код. Введите ключ ниже вручную
      </p>
    );
  }

  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- data:-адрес, оптимизировать нечего
    <img
      src={src}
      alt="QR-код для приложения-аутентификатора"
      width={200}
      height={200}
      className="rounded-sm bg-white"
    />
  ) : (
    <div className="h-[200px] w-[200px] rounded-sm bg-surface" />
  );
}

function BackupCodes({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p role="status">Второй фактор включён. Другие сессии завершены.</p>
      <p className="text-sm">
        Сохраните резервные коды в надёжном месте. Каждый срабатывает один раз
        вместо кода из приложения, если телефон потерян. Больше их не покажем.
      </p>
      <ul
        aria-label="Резервные коды"
        className="grid grid-cols-2 gap-2 rounded-sm border border-line bg-surface p-4 font-mono"
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <button type="button" className={BUTTON_CLASS} onClick={onDone}>
        Я сохранил коды
      </button>
    </div>
  );
}

function Enabled({ backupCodesLeft }: { backupCodesLeft: number }) {
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState(false);
  const [code, setCode] = useState('');

  const disable = useMutation({
    mutationFn: () => disableTwoFactor(code.trim()),
    onSuccess: () => {
      setAsking(false);
      void queryClient.invalidateQueries({ queryKey: twoFactorKey() });
    },
    onError: () => setCode(''),
  });

  return (
    <div className="flex flex-col gap-4">
      <p>Второй фактор включён. Резервных кодов осталось: {backupCodesLeft}.</p>
      {backupCodesLeft <= 2 && (
        <p className="text-sm text-accent">
          Резервных кодов почти не осталось. Чтобы получить новые, выключите и
          снова включите второй фактор.
        </p>
      )}
      {!asking ? (
        <button
          type="button"
          className={LINK_BUTTON_CLASS}
          onClick={() => setAsking(true)}
        >
          Выключить второй фактор
        </button>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim()) disable.mutate();
          }}
        >
          <CodeInput
            value={code}
            onChange={setCode}
            label="Код из приложения или резервный код"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className={BUTTON_CLASS}
              disabled={disable.isPending || !code.trim()}
            >
              Выключить
            </button>
            <button
              type="button"
              className={LINK_BUTTON_CLASS}
              onClick={() => {
                setAsking(false);
                disable.reset();
              }}
            >
              Отмена
            </button>
          </div>
          {disable.isError && (
            <p role="alert" className="text-sm text-accent">
              {codeError(disable.error)}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
