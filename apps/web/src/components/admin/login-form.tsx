'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  LOGIN_ERROR_CODES,
  loginSchema,
  type LoginCredentials,
  type LoginErrorCode,
} from '@portfolio/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, type FieldError } from 'react-hook-form';
import { FormField, INPUT_CLASS } from '@/components/form-field';
import { login, loginTotp, type LoginResult } from '@/lib/admin/auth-api';
import { safeNextPath } from '@/lib/admin/paths';
import { isOneOf } from '@/lib/guards';

type Failure = Exclude<LoginResult, 'ok' | 'mfa'>;

const FIELD_ERRORS: Record<LoginErrorCode, string> = {
  emailTooLong: 'Слишком длинный адрес',
  emailInvalid: 'Введите адрес почты',
  passwordRequired: 'Введите пароль',
  passwordTooLong: 'Слишком длинный пароль',
};

const PASSWORD_ERRORS: Record<Failure, string> = {
  invalid: 'Неверная почта или пароль',
  'rate-limited': 'Слишком много попыток. Подождите 15 минут',
  failed: 'Не удалось войти. Попробуйте ещё раз',
};

const CODE_ERRORS: Record<Failure, string> = {
  invalid: 'Неверный код. Если не помогает, начните вход заново',
  'rate-limited': 'Слишком много попыток. Подождите 15 минут',
  failed: 'Не удалось войти. Попробуйте ещё раз',
};

const BUTTON_CLASS =
  'rounded-sm bg-accent px-5 py-3 font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60';

const fieldError = (error: FieldError | undefined) => {
  if (!error) return undefined;
  const code = error.message;
  return code && isOneOf(LOGIN_ERROR_CODES, code)
    ? FIELD_ERRORS[code]
    : 'Проверьте поле';
};

/**
 * Вход в два шага, если включён второй фактор: пароль, затем код.
 * Без второго фактора после пароля сразу переходим в админку.
 */
export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<'password' | 'code'>('password');

  const enter = () => {
    // Адрес читаем в момент входа, а не через useSearchParams:
    // так страница входа остаётся статической
    const next = new URLSearchParams(window.location.search).get('next');
    router.replace(safeNextPath(next));
  };

  return step === 'password' ? (
    <PasswordStep onEnter={enter} onCodeRequired={() => setStep('code')} />
  ) : (
    <CodeStep onEnter={enter} onRestart={() => setStep('password')} />
  );
}

function PasswordStep({
  onEnter,
  onCodeRequired,
}: {
  onEnter: () => void;
  onCodeRequired: () => void;
}) {
  const [failure, setFailure] = useState<Failure | null>(null);
  const [leaving, setLeaving] = useState(false);
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginCredentials) => {
    setFailure(null);
    const result = await login(values);
    if (result === 'ok') {
      // Кнопка остаётся неактивной, пока идёт переход
      setLeaving(true);
      onEnter();
      return;
    }
    if (result === 'mfa') {
      onCodeRequired();
      return;
    }
    setFailure(result);
    resetField('password');
  };

  const busy = isSubmitting || leaving;

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      className="flex flex-col gap-5"
    >
      <FormField label="Почта" error={fieldError(errors.email)}>
        {(props) => (
          <input
            {...props}
            {...register('email')}
            type="email"
            autoComplete="username"
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField label="Пароль" error={fieldError(errors.password)}>
        {(props) => (
          <input
            {...props}
            {...register('password')}
            type="password"
            autoComplete="current-password"
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      <button type="submit" disabled={busy} className={BUTTON_CLASS}>
        {busy ? 'Входим…' : 'Войти'}
      </button>

      {failure && (
        <p role="alert" className="text-accent">
          {PASSWORD_ERRORS[failure]}
        </p>
      )}
    </form>
  );
}

function CodeStep({
  onEnter,
  onRestart,
}: {
  onEnter: () => void;
  onRestart: () => void;
}) {
  const [code, setCode] = useState('');
  const [failure, setFailure] = useState<Failure | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setFailure(null);
    setBusy(true);
    const result = await loginTotp(code.trim());
    if (result === 'ok') {
      onEnter();
      return;
    }
    setBusy(false);
    setFailure(result);
    setCode('');
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (code.trim()) void submit();
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      <p className="text-sm text-muted">
        Пароль верный. Введите код из приложения-аутентификатора или один из
        резервных кодов.
      </p>
      <FormField label="Код" error={undefined}>
        {(props) => (
          <input
            {...props}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            // Подсказка браузеру и телефону: это одноразовый код
            autoComplete="one-time-code"
            inputMode="text"
            autoFocus
            maxLength={20}
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      <button
        type="submit"
        disabled={busy || !code.trim()}
        className={BUTTON_CLASS}
      >
        {busy ? 'Проверяем…' : 'Подтвердить'}
      </button>
      <button
        type="button"
        onClick={onRestart}
        className="self-start text-sm text-muted underline decoration-line underline-offset-4 hover:text-accent"
      >
        Войти с другими данными
      </button>

      {failure && (
        <p role="alert" className="text-accent">
          {CODE_ERRORS[failure]}
        </p>
      )}
    </form>
  );
}
