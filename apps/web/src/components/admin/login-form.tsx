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
import { login, type LoginResult } from '@/lib/admin/auth-api';
import { safeNextPath } from '@/lib/admin/paths';
import { isOneOf } from '@/lib/guards';

const FIELD_ERRORS: Record<LoginErrorCode, string> = {
  emailTooLong: 'Слишком длинный адрес',
  emailInvalid: 'Введите адрес почты',
  passwordRequired: 'Введите пароль',
  passwordTooLong: 'Слишком длинный пароль',
};

const RESULT_ERRORS: Record<Exclude<LoginResult, 'ok'>, string> = {
  invalid: 'Неверная почта или пароль',
  'rate-limited': 'Слишком много попыток. Подождите 15 минут',
  failed: 'Не удалось войти. Попробуйте ещё раз',
};

const fieldError = (error: FieldError | undefined) => {
  if (!error) return undefined;
  const code = error.message;
  return code && isOneOf(LOGIN_ERROR_CODES, code)
    ? FIELD_ERRORS[code]
    : 'Проверьте поле';
};

export function LoginForm() {
  const router = useRouter();
  const [failure, setFailure] = useState<Exclude<LoginResult, 'ok'> | null>(
    null,
  );
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginCredentials) => {
    setFailure(null);
    const result = await login(values);
    if (result === 'ok') {
      // Адрес читаем при отправке, а не через useSearchParams:
      // так страница входа остаётся статической
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(safeNextPath(next));
      return;
    }
    setFailure(result);
    resetField('password');
  };

  // После успешного входа кнопка остаётся неактивной, пока идёт переход
  const busy = isSubmitting || (isSubmitSuccessful && failure === null);

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

      <button
        type="submit"
        disabled={busy}
        className="rounded-sm bg-accent px-5 py-3 font-medium text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? 'Входим…' : 'Войти'}
      </button>

      {failure && (
        <p role="alert" className="text-accent">
          {RESULT_ERRORS[failure]}
        </p>
      )}
    </form>
  );
}
