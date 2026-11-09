// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendContactMessage } from '@/features/site/contact/contact-api';
import { en } from '@/i18n/dictionaries/en';
import { ru } from '@/i18n/dictionaries/ru';
import { ContactForm } from './contact-form';

vi.mock('@/features/site/contact/contact-api', () => ({
  sendContactMessage: vi.fn(),
}));

const send = vi.mocked(sendContactMessage);

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Имя'), 'Анна');
  await user.type(screen.getByLabelText('Email'), 'anna@example.com');
  await user.type(
    screen.getByLabelText('Сообщение'),
    'Здравствуйте! Хотим обсудить вакансию.',
  );
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Отправить' }));

beforeEach(() => send.mockReset());
afterEach(cleanup);

describe('ContactForm', () => {
  it('обрезает пробелы по краям в поле и при отправке', async () => {
    const user = userEvent.setup();
    send.mockResolvedValue('sent');
    render(<ContactForm dictionary={ru.contact.form} />);

    const name = screen.getByLabelText<HTMLInputElement>('Имя');
    await user.type(name, '  Анна  ');
    await user.tab();
    expect(name.value).toBe('Анна');

    await user.type(screen.getByLabelText('Email'), '  anna@example.com ');
    await user.type(
      screen.getByLabelText('Сообщение'),
      '   Здравствуйте, это проверка.   ',
    );
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(send).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: 'Анна',
        email: 'anna@example.com',
        message: 'Здравствуйте, это проверка.',
      }),
    );
  });

  it('показывает ошибки на языке словаря', async () => {
    render(<ContactForm dictionary={en.contact.form} />);

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Enter a valid email')).toBeTruthy();
    expect(
      screen.getByText('Enter your name: at least 2 characters'),
    ).toBeTruthy();
  });

  it('показывает ошибки и не отправляет неверные данные', async () => {
    const user = userEvent.setup();
    render(<ContactForm dictionary={ru.contact.form} />);

    await user.type(screen.getByLabelText('Email'), 'не-почта');
    await submit(user);

    expect(await screen.findByText('Укажите корректный email')).toBeTruthy();
    expect(screen.getByText('Укажите имя: минимум 2 символа')).toBeTruthy();
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe(
      'true',
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('после отправки показывает успех и очищает форму', async () => {
    send.mockResolvedValue('sent');
    const user = userEvent.setup();
    render(<ContactForm dictionary={ru.contact.form} />);

    await fillValid(user);
    await submit(user);

    expect((await screen.findByRole('status')).textContent).toContain(
      'Сообщение отправлено',
    );
    expect(send).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ name: 'Анна', email: 'anna@example.com' }),
    );
    expect(screen.getByLabelText<HTMLInputElement>('Имя').value).toBe('');
  });

  it.each([
    ['rate-limited', 'Слишком много отправок'],
    ['failed', 'Не удалось отправить'],
  ] as const)(
    'при %s сообщает об ошибке и сохраняет текст',
    async (result, text) => {
      send.mockResolvedValue(result);
      const user = userEvent.setup();
      render(<ContactForm dictionary={ru.contact.form} />);

      await fillValid(user);
      await submit(user);

      expect((await screen.findByRole('alert')).textContent).toContain(text);
      expect(screen.getByLabelText<HTMLInputElement>('Имя').value).toBe('Анна');
    },
  );

  it('honeypot недоступен с клавиатуры и скрыт от скринридеров', () => {
    const { container } = render(<ContactForm dictionary={ru.contact.form} />);

    const honeypot = container.querySelector('input[name="website"]');
    expect(honeypot?.getAttribute('tabindex')).toBe('-1');
    expect(honeypot?.closest('[aria-hidden="true"]')).toBeTruthy();
  });
});
