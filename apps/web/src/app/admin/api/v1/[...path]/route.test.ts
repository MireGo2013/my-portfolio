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
import { POST, GET } from './route';

const API = 'http://api.test';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => {
  vi.stubEnv('API_URL', API);
  vi.stubEnv('PROXY_SECRET', 'secret');
});
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

function call(
  handler: typeof GET,
  path: string[],
  init: { method?: string; cookie?: string; body?: string } = {},
) {
  const headers = new Headers({
    origin: 'http://site.test',
    'x-real-ip': '203.0.113.5',
  });
  if (init.cookie) headers.set('cookie', init.cookie);
  if (init.body) headers.set('content-type', 'application/json');
  const request = new NextRequest(
    `http://site.test/admin/api/v1/${path.join('/')}`,
    { method: init.method ?? 'GET', headers, body: init.body },
  );
  return handler(request, { params: Promise.resolve({ path }) });
}

describe('прокси админки', () => {
  it('передаёт запрос в API с IP посетителя, секретом и только cookie админки', async () => {
    let seen: Headers | undefined;
    let body: unknown;
    server.use(
      http.post(`${API}/api/v1/auth/login`, async ({ request }) => {
        seen = request.headers;
        body = await request.json();
        return new HttpResponse(null, {
          status: 204,
          headers: { 'set-cookie': 'admin_access=new; Path=/; HttpOnly' },
        });
      }),
    );

    const response = await call(POST, ['auth', 'login'], {
      method: 'POST',
      cookie: 'admin_access=old; locale=ru',
      body: JSON.stringify({ email: 'a@b.c', password: 'p' }),
    });

    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()).toEqual([
      'admin_access=new; Path=/; HttpOnly',
    ]);
    expect(body).toEqual({ email: 'a@b.c', password: 'p' });
    expect(seen?.get('cookie')).toBe('admin_access=old');
    expect(seen?.get('x-proxy-secret')).toBe('secret');
    expect(seen?.get('x-client-ip')).toBe('203.0.113.5');
    expect(seen?.get('origin')).toBe('http://site.test');
  });

  it.each([[['health']], [['admin', '..', 'health']], [['profile']]])(
    'не пускает за пределы входа и админки: %j',
    async (path) => {
      const response = await call(GET, path);

      expect(response.status).toBe(404);
    },
  );

  it('при истёкшем токене обновляет его и повторяет запрос', async () => {
    const accessSeen: (string | null)[] = [];
    server.use(
      http.get(`${API}/api/v1/admin/things`, ({ request }) => {
        const cookie = request.headers.get('cookie');
        accessSeen.push(cookie);
        return cookie === 'admin_access=fresh; admin_refresh=r2'
          ? HttpResponse.json({ ok: true })
          : new HttpResponse(null, { status: 401 });
      }),
      http.post(`${API}/api/v1/auth/refresh`, ({ request }) => {
        expect(request.headers.get('cookie')).toBe('admin_refresh=r1');
        return new HttpResponse(null, {
          status: 204,
          headers: [
            ['set-cookie', 'admin_access=fresh; Path=/'],
            ['set-cookie', 'admin_refresh=r2; Path=/'],
          ],
        });
      }),
    );

    const response = await call(GET, ['admin', 'things'], {
      cookie: 'admin_access=stale; admin_refresh=r1',
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(accessSeen).toHaveLength(2);
    // Браузер получит новые cookie
    expect(response.headers.getSetCookie()).toEqual([
      'admin_access=fresh; Path=/',
      'admin_refresh=r2; Path=/',
    ]);
  });

  it('если обновить не вышло, отдаёт 401 и стирает cookie', async () => {
    server.use(
      http.get(
        `${API}/api/v1/admin/things`,
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post(
        `${API}/api/v1/auth/refresh`,
        () =>
          new HttpResponse(null, {
            status: 401,
            headers: { 'set-cookie': 'admin_refresh=; Max-Age=0' },
          }),
      ),
    );

    const response = await call(GET, ['admin', 'things'], {
      cookie: 'admin_refresh=dead',
    });

    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([
      'admin_refresh=; Max-Age=0',
    ]);
  });
});
