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
import { revalidateTag } from 'next/cache';
import { DELETE, GET, POST, PUT } from './route';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
const revalidate = vi.mocked(revalidateTag);

const API = 'http://api.test';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => {
  vi.stubEnv('API_URL', API);
  vi.stubEnv('PROXY_SECRET', 'secret');
  // Как на Vercel: x-real-ip выставляет платформа
  vi.stubEnv('TRUST_X_REAL_IP', 'true');
});
afterEach(() => {
  revalidate.mockReset();
  server.resetHandlers();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

function call(
  handler: typeof GET,
  path: string[],
  init: {
    method?: string;
    cookie?: string;
    body?: string;
    origin?: string;
  } = {},
) {
  const headers = new Headers({
    origin: init.origin ?? 'http://site.test',
    host: 'site.test',
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
    // Источник проверен здесь, в API он не нужен
    expect(seen?.get('origin')).toBe(null);
  });

  it('без доверия к x-real-ip адрес посетителя в API не передаёт', async () => {
    vi.stubEnv('TRUST_X_REAL_IP', '');
    let seen: Headers | undefined;
    server.use(
      http.get(`${API}/api/v1/admin/things`, ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({});
      }),
    );

    await call(GET, ['admin', 'things']);

    // Иначе любой прислал бы новый IP на каждую попытку входа
    expect(seen?.get('x-client-ip')).toBe(null);
    expect(seen?.get('x-proxy-secret')).toBe(null);
  });

  it('Sec-Fetch-Site от браузера главнее сравнения адресов', async () => {
    server.use(
      http.post(
        `${API}/api/v1/auth/logout`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const send = (site: string) =>
      POST(
        new NextRequest('http://site.test/admin/api/v1/auth/logout', {
          method: 'POST',
          // Прокси переписал Host, и Origin с ним не совпадает
          headers: {
            origin: 'https://public.example.com',
            host: 'web:3000',
            'sec-fetch-site': site,
          },
          body: '{}',
        }),
        { params: Promise.resolve({ path: ['auth', 'logout'] }) },
      );

    expect((await send('same-origin')).status).toBe(204);
    expect((await send('cross-site')).status).toBe(403);
  });

  it('изменяющий запрос с чужого сайта не доходит до API', async () => {
    // Обработчика в MSW нет: запрос в API упал бы с ошибкой
    const response = await call(POST, ['auth', 'logout'], {
      method: 'POST',
      origin: 'https://evil.example.com',
      body: '{}',
    });

    expect(response.status).toBe(403);
  });

  it('пропускает адрес, на который пришёл браузер, даже если он не основной', async () => {
    server.use(
      http.post(
        `${API}/api/v1/auth/logout`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    const headers = new Headers({
      origin: 'https://preview-abc.vercel.app',
      host: 'preview-abc.vercel.app',
    });
    const request = new NextRequest(
      'https://preview-abc.vercel.app/admin/api/v1/auth/logout',
      { method: 'POST', headers, body: '{}' },
    );

    const response = await POST(request, {
      params: Promise.resolve({ path: ['auth', 'logout'] }),
    });

    expect(response.status).toBe(204);
  });

  it('после обновления повторяет запрос с прежним токеном обновления, если нового нет', async () => {
    let retried: string | null = null;
    server.use(
      http.get(`${API}/api/v1/admin/things`, ({ request }) => {
        const cookie = request.headers.get('cookie');
        if (cookie?.includes('admin_access=fresh')) {
          retried = cookie;
          return HttpResponse.json({ ok: true });
        }
        return new HttpResponse(null, { status: 401 });
      }),
      // Соседний запрос уже заменил токен: API отдаёт только токен доступа
      http.post(
        `${API}/api/v1/auth/refresh`,
        () =>
          new HttpResponse(null, {
            status: 204,
            headers: { 'set-cookie': 'admin_access=fresh; Path=/' },
          }),
      ),
    );

    const response = await call(GET, ['admin', 'things'], {
      cookie: 'admin_refresh=r1',
    });

    expect(response.status).toBe(200);
    expect(retried).toBe('admin_access=fresh; admin_refresh=r1');
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

  it('если обновить не вышло, отдаёт 401 и cookie не трогает', async () => {
    server.use(
      http.get(
        `${API}/api/v1/admin/things`,
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post(
        `${API}/api/v1/auth/refresh`,
        () => new HttpResponse(null, { status: 401 }),
      ),
    );

    const response = await call(GET, ['admin', 'things'], {
      cookie: 'admin_refresh=dead',
    });

    expect(response.status).toBe(401);
    // Соседний запрос мог уже получить новый токен: стирать нельзя
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  describe('сброс кэша сайта', () => {
    const CONTENT = `${API}/api/v1/admin/content`;

    it('после сохранения контента сбрасывает метку раздела сразу', async () => {
      server.use(
        http.put(`${CONTENT}/profile`, () => HttpResponse.json({})),
        http.delete(
          `${CONTENT}/skills/x`,
          () => new HttpResponse(null, { status: 204 }),
        ),
      );

      await call(PUT, ['admin', 'content', 'profile'], {
        method: 'PUT',
        body: '{}',
      });
      await call(DELETE, ['admin', 'content', 'skills', 'x'], {
        method: 'DELETE',
      });

      expect(revalidate.mock.calls).toEqual([
        ['profile', { expire: 0 }],
        ['skills', { expire: 0 }],
      ]);
    });

    it('не сбрасывает при чтении, ошибке и вне раздела контента', async () => {
      server.use(
        http.get(`${CONTENT}/profile`, () => HttpResponse.json({})),
        http.put(
          `${CONTENT}/projects/x`,
          () => new HttpResponse(null, { status: 400 }),
        ),
        http.patch(`${API}/api/v1/admin/messages/x`, () =>
          HttpResponse.json({}),
        ),
      );

      await call(GET, ['admin', 'content', 'profile']);
      await call(PUT, ['admin', 'content', 'projects', 'x'], {
        method: 'PUT',
        body: '{}',
      });
      await call(PUT, ['admin', 'messages', 'x'], {
        method: 'PATCH',
        body: '{}',
      });

      expect(revalidate).not.toHaveBeenCalled();
    });
  });

  it('если API не отвечает вовсе, отдаёт понятный 503', async () => {
    server.use(
      http.get(API + '/api/v1/admin/things', () => HttpResponse.error()),
    );

    const response = await call(GET, ['admin', 'things']);

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'apiUnavailable' });
  });
});
