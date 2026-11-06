import { del, put } from '@vercel/blob';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { revalidateTag } from 'next/cache';
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
import { DELETE, POST } from './route';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
vi.mock('@vercel/blob', () => ({ put: vi.fn(), del: vi.fn() }));

const API = 'http://api.test/api/v1';
const BLOB = 'https://abc.public.blob.vercel-storage.com/cv';
const server = setupServer();

const putMock = vi.mocked(put);
const delMock = vi.mocked(del);
const revalidate = vi.mocked(revalidateTag);

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
beforeEach(() => {
  vi.stubEnv('API_URL', 'http://api.test');
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
  putMock.mockResolvedValue({ url: `${BLOB}/new.pdf` } as never);
  delMock.mockResolvedValue(undefined);
});
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
afterAll(() => server.close());

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // %PDF-1.7

/**
 * Запрос, как его шлёт браузер: multipart с границей и Content-Length.
 * Тело собираем через обычный Request, чтобы узнать его длину.
 */
async function upload(
  body: BlobPart = PDF,
  {
    type = 'application/pdf',
    locale = 'ru',
    site = 'same-origin',
    cookie = 'admin_access=a1',
    withLength = true,
  } = {},
) {
  const form = new FormData();
  form.set('file', new File([body], 'cv.pdf', { type }));
  const encoded = new Request('http://site.test', {
    method: 'POST',
    body: form,
  });
  const bytes = await encoded.arrayBuffer();
  const headers: Record<string, string> = {
    cookie,
    'sec-fetch-site': site,
    'content-type': encoded.headers.get('content-type') ?? '',
  };
  if (withLength) headers['content-length'] = String(bytes.byteLength);
  return POST(
    new NextRequest(`http://site.test/admin/api/cv/${locale}`, {
      method: 'POST',
      headers,
      body: bytes,
    }),
    { params: Promise.resolve({ locale }) },
  );
}

/** API: вход действителен, адрес сохраняется, прежний — previous. */
function apiAccepts(previous: string | null = `${BLOB}/old.pdf`) {
  const saved: unknown[] = [];
  server.use(
    http.get(`${API}/auth/me`, () => HttpResponse.json({})),
    http.put(`${API}/admin/content/cv/ru`, async ({ request }) => {
      saved.push(await request.json());
      return HttpResponse.json({ ru: `${BLOB}/new.pdf`, en: null, previous });
    }),
  );
  return saved;
}

describe('загрузка резюме', () => {
  it('кладёт PDF в хранилище, сообщает адрес API и удаляет старый файл', async () => {
    const saved = apiAccepts();

    const response = await upload();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ru: `${BLOB}/new.pdf`, en: null });
    expect(putMock).toHaveBeenCalledWith(
      'cv/Sobol_Vladislav_CV_RU.pdf',
      expect.any(File),
      expect.objectContaining({ access: 'public', addRandomSuffix: true }),
    );
    expect(saved).toEqual([{ url: `${BLOB}/new.pdf` }]);
    expect(delMock).toHaveBeenCalledWith(`${BLOB}/old.pdf`);
    expect(revalidate).toHaveBeenCalledWith('profile', { expire: 0 });
  });

  it('без сессии ничего не загружает', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => new HttpResponse(null, { status: 401 })),
    );

    const response = await upload();

    expect(response.status).toBe(401);
    expect(putMock).not.toHaveBeenCalled();
  });

  it('с чужого сайта не принимает и не ходит в API', async () => {
    const response = await upload(PDF, { site: 'cross-site' });

    expect(response.status).toBe(403);
    expect(putMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'не PDF по содержимому',
      new Uint8Array([0x4d, 0x5a, 0x90]),
      'application/pdf',
      'notPdf',
    ],
    ['не PDF по типу', PDF, 'text/plain', 'notPdf'],
  ] as const)('отклоняет файл: %s', async (_name, body, type, code) => {
    apiAccepts();

    const response = await upload(body, { type });

    expect(response.status).toBe(400);
    expect(((await response.json()) as { code: string }).code).toBe(code);
    expect(putMock).not.toHaveBeenCalled();
  });

  it('отклоняет файл больше лимита', async () => {
    apiAccepts();
    const big = new Uint8Array(4 * 1024 * 1024 + 1);
    big.set(PDF);

    const response = await upload(big);

    expect(response.status).toBe(413);
    expect(putMock).not.toHaveBeenCalled();
  });

  it('без подключённого хранилища отвечает 503', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', '');
    apiAccepts();

    const response = await upload();

    expect(response.status).toBe(503);
    expect(((await response.json()) as { code: string }).code).toBe(
      'storageNotConfigured',
    );
  });

  it('если API точно не сохранил адрес, удаляет только что загруженный файл', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({})),
      http.put(`${API}/admin/content/cv/ru`, () =>
        HttpResponse.json({ errors: { url: ['urlInvalid'] } }, { status: 400 }),
      ),
    );

    const response = await upload();

    expect(response.status).toBe(400);
    expect(delMock).toHaveBeenCalledWith(`${BLOB}/new.pdf`);
    expect(revalidate).not.toHaveBeenCalled();
  });

  it('если API упал, но адрес сохранил, файл не удаляет', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({})),
      http.put(
        `${API}/admin/content/cv/ru`,
        () => new HttpResponse(null, { status: 502 }),
      ),
      // Проверка показывает: адрес уже в базе
      http.get(`${API}/admin/content/cv`, () =>
        HttpResponse.json({ ru: `${BLOB}/new.pdf`, en: null }),
      ),
    );

    const response = await upload();

    expect(response.status).toBe(502);
    expect(delMock).not.toHaveBeenCalled();
  });

  it('если неизвестно, сохранён ли адрес, файл тоже не удаляет', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({})),
      http.put(`${API}/admin/content/cv/ru`, () => HttpResponse.error()),
      http.get(`${API}/admin/content/cv`, () => HttpResponse.error()),
    );

    const response = await upload();

    expect(response.status).toBe(502);
    expect(delMock).not.toHaveBeenCalled();
  });

  it('без Content-Length не читает тело', async () => {
    apiAccepts();

    const response = await upload(PDF, { withLength: false });

    expect(response.status).toBe(411);
    expect(putMock).not.toHaveBeenCalled();
  });

  it('новые cookie сессии уходят и в ответе с ошибкой', async () => {
    server.use(
      http.get(`${API}/auth/me`, ({ request }) =>
        request.headers.get('cookie')?.includes('admin_access=fresh')
          ? HttpResponse.json({})
          : new HttpResponse(null, { status: 401 }),
      ),
      http.post(
        `${API}/auth/refresh`,
        () =>
          new HttpResponse(null, {
            status: 204,
            headers: [
              ['set-cookie', 'admin_access=fresh; Path=/'],
              ['set-cookie', 'admin_refresh=r2; Path=/'],
            ],
          }),
      ),
    );

    // Токен доступа истёк, а файл — не PDF
    const response = await upload(new Uint8Array([1, 2, 3]), {
      cookie: 'admin_refresh=r1',
    });

    expect(response.status).toBe(400);
    expect(response.headers.getSetCookie()).toEqual([
      'admin_access=fresh; Path=/',
      'admin_refresh=r2; Path=/',
    ]);
  });

  it('неизвестный язык — 404', async () => {
    const response = await upload(PDF, { locale: 'de' });

    expect(response.status).toBe(404);
  });
});

describe('возврат резюме из сборки', () => {
  it('снимает адрес в API и удаляет файл из хранилища', async () => {
    server.use(
      http.get(`${API}/auth/me`, () => HttpResponse.json({})),
      http.delete(`${API}/admin/content/cv/en`, () =>
        HttpResponse.json({ ru: null, en: null, previous: `${BLOB}/en.pdf` }),
      ),
    );

    const response = await DELETE(
      new NextRequest('http://site.test/admin/api/cv/en', {
        method: 'DELETE',
        headers: { cookie: 'admin_access=a1', 'sec-fetch-site': 'same-origin' },
      }),
      { params: Promise.resolve({ locale: 'en' }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ru: null, en: null });
    expect(delMock).toHaveBeenCalledWith(`${BLOB}/en.pdf`);
    expect(revalidate).toHaveBeenCalledWith('profile', { expire: 0 });
  });
});
