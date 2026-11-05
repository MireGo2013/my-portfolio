import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { sendContactMessage } from './contact-api';

const BASE_URL = 'http://api.test';
const URL = `${BASE_URL}/api/v1/contact`;
const message = {
  name: 'Анна',
  email: 'anna@example.com',
  message: 'Здравствуйте!',
};

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('sendContactMessage', () => {
  it('отправляет сообщение и возвращает sent', async () => {
    let received: unknown;
    server.use(
      http.post(URL, async ({ request }) => {
        received = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(sendContactMessage(BASE_URL, message)).resolves.toBe('sent');
    expect(received).toEqual(message);
  });

  it.each([
    [429, 'rate-limited'],
    [400, 'failed'],
    [500, 'failed'],
  ])('на ответ %i возвращает %s', async (status, result) => {
    server.use(http.post(URL, () => new HttpResponse(null, { status })));

    await expect(sendContactMessage(BASE_URL, message)).resolves.toBe(result);
  });

  it('не бросает ошибку, когда API недоступен', async () => {
    server.use(http.post(URL, () => HttpResponse.error()));

    await expect(sendContactMessage(BASE_URL, message)).resolves.toBe('failed');
  });
});
