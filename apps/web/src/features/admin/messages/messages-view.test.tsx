// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { MessagesView } from './messages-view';

// Next.js обновляет useSearchParams после pushState сам, здесь его нет.
// Поэтому проверяем, что компонент читает адрес и какой адрес он ставит
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const API = 'http://localhost:3000/admin/api/v1/admin/messages';
const server = setupServer();

const message = (name: string, status = 'NEW') => ({
  id: `id-${name}`,
  name,
  email: `${name}@example.com`,
  message: `Текст от ${name}`,
  status,
  createdAt: '2026-11-01T09:30:00.000Z',
  updatedAt: '2026-11-01T09:30:00.000Z',
});

const counts = { NEW: 2, READ: 1, REPLIED: 0, ARCHIVED: 0, SPAM: 4, total: 7 };

function renderView(search = '') {
  window.history.replaceState(null, '', `/admin/messages${search}`);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MessagesView />
    </QueryClientProvider>,
  );
}

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => {
  server.use(http.get(`${API}/counts`, () => HttpResponse.json(counts)));
});
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('MessagesView', () => {
  it('передаёт фильтры из адреса в API и показывает строки', async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(API, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json({
          items: [message('Анна'), message('Борис', 'READ')],
          total: 2,
          page: 1,
          pageSize: 20,
          pageCount: 1,
        });
      }),
    );

    renderView('?status=NEW&q=анна&sort=name&order=asc');

    const row = (await screen.findByRole('link', { name: 'Анна' })).closest(
      'tr',
    );
    expect(within(row!).getByText('Новое')).toBeTruthy();
    expect(screen.getByText('Прочитано')).toBeTruthy();
    expect(query?.get('status')).toBe('NEW');
    expect(query?.get('q')).toBe('анна');
    expect(query?.get('sort')).toBe('name');
    expect(
      screen.getByRole('link', { name: 'Анна' }).getAttribute('href'),
    ).toBe('/admin/messages/id-Анна');
    // Счётчики во вкладках. jsdom склеивает имя кнопки без пробела,
    // браузер — с пробелом, поэтому пробел в шаблоне необязательный
    const spam = await screen.findByRole('button', { name: /^Спам\s*4$/ });
    expect(spam.getAttribute('aria-pressed')).toBe('false');
    const fresh = screen.getByRole('button', { name: /^Новые\s*2$/ });
    expect(fresh.getAttribute('aria-pressed')).toBe('true');
  });

  it('вкладка и сортировка меняют адрес и сбрасывают страницу', async () => {
    server.use(
      http.get(API, () =>
        HttpResponse.json({
          items: [message('Анна')],
          total: 45,
          page: 3,
          pageSize: 20,
          pageCount: 3,
        }),
      ),
    );
    const user = userEvent.setup();
    renderView('?page=3');
    await screen.findByRole('link', { name: 'Анна' });

    await user.click(await screen.findByRole('button', { name: /^Спам\s*4$/ }));
    expect(window.location.search).toBe('?status=SPAM');

    await user.click(screen.getByRole('button', { name: /Имя/ }));
    expect(window.location.search).toBe('?sort=name&order=asc');
  });

  it('без сообщений говорит об этом, а при ошибке предлагает повторить', async () => {
    server.use(
      http.get(API, () =>
        HttpResponse.json({
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          pageCount: 1,
        }),
      ),
    );
    renderView();
    expect(await screen.findByText('Сообщений пока нет')).toBeTruthy();
    cleanup();

    server.use(http.get(API, () => new HttpResponse(null, { status: 500 })));
    renderView();
    expect(
      await screen.findByText('Не удалось загрузить сообщения'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeTruthy();
  });

  it('при «с» позже «по» не ходит в API и объясняет почему', async () => {
    const list = vi.fn(() => HttpResponse.json({}));
    server.use(http.get(API, list));

    renderView('?from=2026-11-05&to=2026-11-01');

    expect(await screen.findByText('Начало периода позже конца')).toBeTruthy();
    expect(list).not.toHaveBeenCalled();
  });
});
