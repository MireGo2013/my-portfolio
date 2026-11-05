import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createContentApi, type Profile } from './content-api';

const BASE_URL = 'http://api.test';
const PROFILE_URL = `${BASE_URL}/api/v1/profile`;

const profile: Profile = {
  fullName: 'Тест Тестов',
  title: 'Engineer',
  specialization: 'TypeScript',
  summary: 'Описание',
  email: 'test@example.com',
  telegramUrl: 'https://t.me/test',
  githubUrl: 'https://github.com/test',
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('createContentApi', () => {
  it('возвращает профиль из ответа API', async () => {
    server.use(http.get(PROFILE_URL, () => HttpResponse.json(profile)));

    await expect(createContentApi(BASE_URL).getProfile()).resolves.toEqual(
      profile,
    );
  });

  // Важно бросить ошибку: иначе на сборке сайт опубликуется с пустым контентом
  it.each([404, 500])('бросает ошибку при ответе %i', async (status) => {
    server.use(
      http.get(PROFILE_URL, () => new HttpResponse(null, { status })),
    );

    await expect(createContentApi(BASE_URL).getProfile()).rejects.toThrow(
      String(status),
    );
  });

  it('бросает ошибку, когда API недоступен', async () => {
    server.use(http.get(PROFILE_URL, () => HttpResponse.error()));

    await expect(createContentApi(BASE_URL).getProfile()).rejects.toThrow();
  });
});
