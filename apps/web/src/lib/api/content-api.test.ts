import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createContentApi } from './content-api';

const BASE_URL = 'http://api.test';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const endpoints = [
  ['getProfile', '/api/v1/profile', { fullName: 'Тест Тестов' }],
  ['getExperience', '/api/v1/experience', [{ slug: 'a' }]],
  ['getProjects', '/api/v1/projects', [{ slug: 'b' }]],
  ['getSkills', '/api/v1/skills', [{ slug: 'c' }]],
] as const;

describe.each(endpoints)('createContentApi.%s', (method, path, body) => {
  const url = `${BASE_URL}${path}`;
  const call = () => createContentApi(BASE_URL)[method]();

  it('возвращает данные из ответа API', async () => {
    server.use(http.get(url, () => HttpResponse.json(body)));

    await expect(call()).resolves.toEqual(body);
  });

  it('бросает ошибку с кодом ответа', async () => {
    server.use(http.get(url, () => new HttpResponse(null, { status: 500 })));

    await expect(call()).rejects.toThrow('500');
  });

  it('бросает ошибку, когда API недоступен', async () => {
    server.use(http.get(url, () => HttpResponse.error()));

    await expect(call()).rejects.toThrow();
  });
});

describe('createContentApi', () => {
  it('пустой список это не ошибка', async () => {
    server.use(
      http.get(`${BASE_URL}/api/v1/projects`, () => HttpResponse.json([])),
    );

    await expect(createContentApi(BASE_URL).getProjects()).resolves.toEqual([]);
  });

  it('отвечает ошибкой на 404, если база не заполнена', async () => {
    server.use(
      http.get(
        `${BASE_URL}/api/v1/profile`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    );

    await expect(createContentApi(BASE_URL).getProfile()).rejects.toThrow(
      '404',
    );
  });
});
