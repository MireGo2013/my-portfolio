// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { login, loginTotp } from '@/lib/admin/auth-api';
import { LoginForm } from './login-form';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@/lib/admin/auth-api', () => ({ login: vi.fn(), loginTotp: vi.fn() }));

const loginMock = vi.mocked(login);
const totpMock = vi.mocked(loginTotp);

async function submit(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText('Почта'), email);
  if (password) await user.type(screen.getByLabelText('Пароль'), password);
  await user.click(screen.getByRole('button', { name: 'Войти' }));
}

beforeEach(() => {
  loginMock.mockReset();
  totpMock.mockReset();
  replace.mockReset();
  window.history.replaceState(null, '', '/admin/login');
});
afterEach(cleanup);

describe('LoginForm', () => {
  it('без данных показывает ошибки и не ходит в API', async () => {
    render(<LoginForm />);

    await submit('', '');

    expect(await screen.findByText('Введите адрес почты')).toBeTruthy();
    expect(screen.getByText('Введите пароль')).toBeTruthy();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('после входа ведёт на страницу из next', async () => {
    loginMock.mockResolvedValue('ok');
    window.history.replaceState(null, '', '/admin/login?next=%2Fadmin%2Fcv');
    render(<LoginForm />);

    await submit(' Admin@Example.com ', 'secret');

    expect(loginMock).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'secret',
    });
    expect(replace).toHaveBeenCalledWith('/admin/cv');
  });

  it('чужой адрес в next заменяет началом админки', async () => {
    loginMock.mockResolvedValue('ok');
    window.history.replaceState(
      null,
      '',
      '/admin/login?next=https%3A%2F%2Fevil.example.com',
    );
    render(<LoginForm />);

    await submit('admin@example.com', 'secret');

    expect(replace).toHaveBeenCalledWith('/admin/messages');
  });

  it.each([
    ['invalid', 'Неверная почта или пароль'],
    ['rate-limited', 'Слишком много попыток. Подождите 15 минут'],
    ['failed', 'Не удалось войти. Попробуйте ещё раз'],
  ] as const)(
    'на ответ %s показывает ошибку и очищает пароль',
    async (result, text) => {
      loginMock.mockResolvedValue(result);
      render(<LoginForm />);

      await submit('admin@example.com', 'secret');

      expect((await screen.findByRole('alert')).textContent).toBe(text);
      expect(screen.getByLabelText<HTMLInputElement>('Пароль').value).toBe('');
      expect(replace).not.toHaveBeenCalled();
    },
  );

  it('со вторым фактором после пароля спрашивает код', async () => {
    loginMock.mockResolvedValue('mfa');
    totpMock.mockResolvedValueOnce('invalid').mockResolvedValueOnce('ok');
    const user = userEvent.setup();
    render(<LoginForm />);

    await submit('admin@example.com', 'secret');
    expect(replace).not.toHaveBeenCalled();

    const code = await screen.findByLabelText('Код');
    await user.type(code, '000000');
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(
      /Неверный код/,
    );

    await user.type(code, '123456');
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));
    expect(totpMock).toHaveBeenLastCalledWith('123456');
    expect(replace).toHaveBeenCalledWith('/admin/messages');
  });

  it('с шага кода можно вернуться к паролю', async () => {
    loginMock.mockResolvedValue('mfa');
    const user = userEvent.setup();
    render(<LoginForm />);
    await submit('admin@example.com', 'secret');

    await user.click(
      await screen.findByRole('button', { name: 'Войти с другими данными' }),
    );

    expect(screen.getByLabelText('Пароль')).toBeTruthy();
  });

  it('если шаг с кодом истёк, возвращает к паролю и объясняет почему', async () => {
    loginMock.mockResolvedValue('mfa');
    totpMock.mockResolvedValue('expired');
    const user = userEvent.setup();
    render(<LoginForm />);
    await submit('admin@example.com', 'secret');

    await user.type(await screen.findByLabelText('Код'), '123456');
    await user.click(screen.getByRole('button', { name: 'Подтвердить' }));

    expect((await screen.findByRole('status')).textContent).toMatch(
      /Время на ввод кода вышло/,
    );
    expect(screen.getByLabelText('Пароль')).toBeTruthy();
  });
});
