import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { NextRequest } from 'next/server';
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
import { GET } from './route';

const API = 'http://api.test/api/v1';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => vi.stubEnv('API_URL', 'http://api.test'));
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

function call(next: string, cookie = 'admin_refresh=r1') {
  return GET(
    new NextRequest(
      `http://localhost:3000/admin/api/session/refresh?next=${encodeURIComponent(next)}`,
      {
        // Прокси переписал Host: перенаправление всё равно должно быть на свой сайт
        headers: {
          cookie,
          host: 'evil.example',
          'x-forwarded-host': 'evil.example',
        },
      },
    ),
  );
}

describe('обновление сессии для страниц', () => {
  it('обновляет токен и возвращает на страницу относительным адресом', async () => {
    server.use(
      http.post(
        `${API}/auth/refresh`,
        () =>
          new HttpResponse(null, {
            status: 204,
            headers: { 'set-cookie': 'admin_access=fresh; Path=/' },
          }),
      ),
      http.get(`${API}/auth/me`, ({ request }) =>
        request.headers.get('cookie') === 'admin_access=fresh; admin_refresh=r1'
          ? HttpResponse.json({})
          : new HttpResponse(null, { status: 401 }),
      ),
    );

    const response = await call('/admin/skills');

    expect(response.status).toBe(307);
    // Без хоста: браузер подставит свой, заголовки запроса на цель не влияют
    expect(response.headers.get('location')).toBe('/admin/skills');
    expect(response.headers.getSetCookie()).toEqual([
      'admin_access=fresh; Path=/',
    ]);
  });

  it('мёртвую сессию отправляет на вход и стирает cookie', async () => {
    server.use(
      http.post(
        `${API}/auth/refresh`,
        () => new HttpResponse(null, { status: 401 }),
      ),
    );

    const response = await call('/admin/skills');

    expect(response.headers.get('location')).toBe(
      '/admin/login?next=%2Fadmin%2Fskills',
    );
    const cleared = response.headers.getSetCookie();
    // Все cookie админки: доступ, обновление и шаг с кодом второго фактора
    expect(cleared).toHaveLength(3);
    for (const line of cleared) expect(line).toMatch(/Max-Age=0/);
  });

  it('чужой адрес в next заменяет началом админки', async () => {
    const response = await call('https://evil.example/admin', '');

    expect(response.headers.get('location')).toBe(
      '/admin/login?next=%2Fadmin%2Fmessages',
    );
  });
});
