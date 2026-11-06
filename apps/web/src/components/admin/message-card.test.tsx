// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { MessageCard } from './message-card';

const ID = '01900000-0000-7000-8000-000000000001';
vi.mock('next/navigation', () => ({ useParams: () => ({ id: ID }) }));

const URL = `http://localhost:3000/admin/api/v1/admin/messages/${ID}`;
const server = setupServer();

const message = (status: string) => ({
  id: ID,
  name: 'Анна',
  email: 'anna@example.com',
  message: 'Здравствуйте!\nХотим обсудить вакансию.',
  status,
  createdAt: '2026-11-01T09:30:00.000Z',
  updatedAt: '2026-11-01T09:30:00.000Z',
});

/** Сервер с одним сообщением, который запоминает присланные статусы. */
function serveMessage(initialStatus: string) {
  let current = initialStatus;
  const patches: string[] = [];
  server.use(
    http.get(URL, () => HttpResponse.json(message(current))),
    http.patch(URL, async ({ request }) => {
      const { status } = (await request.json()) as { status: string };
      patches.push(status);
      current = status;
      return HttpResponse.json(message(current));
    }),
  );
  return patches;
}

function renderCard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MessageCard />
    </QueryClientProvider>,
  );
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('MessageCard', () => {
  it('новое сообщение при открытии становится прочитанным', async () => {
    const patches = serveMessage('NEW');

    renderCard();

    expect(await screen.findByRole('heading', { name: 'Анна' })).toBeTruthy();
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Прочитано' })
          .getAttribute('aria-pressed'),
      ).toBe('true'),
    );
    expect(patches).toEqual(['READ']);
  });

  it('прочитанное не трогает, а кнопка меняет статус', async () => {
    const patches = serveMessage('READ');
    const user = userEvent.setup();
    renderCard();
    await screen.findByRole('heading', { name: 'Анна' });

    await user.click(screen.getByRole('button', { name: 'Спам' }));

    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Спам' })
          .getAttribute('aria-pressed'),
      ).toBe('true'),
    );
    expect(patches).toEqual(['SPAM']);
  });

  it('ссылка «Ответить письмом» цитирует сообщение', async () => {
    serveMessage('READ');
    renderCard();

    const reply = await screen.findByRole('link', { name: 'Ответить письмом' });
    const href = reply.getAttribute('href') ?? '';

    expect(href.startsWith('mailto:anna@example.com?')).toBe(true);
    const params = new URLSearchParams(href.split('?')[1]);
    expect(params.get('subject')).toBe('Re: ваше сообщение с сайта');
    expect(params.get('body')).toBe(
      '\n\n> Здравствуйте!\n> Хотим обсудить вакансию.',
    );
  });

  it('несуществующее сообщение', async () => {
    server.use(http.get(URL, () => new HttpResponse(null, { status: 404 })));

    renderCard();

    expect(await screen.findByText('Сообщение не найдено')).toBeTruthy();
  });
});
