// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { CvEditor } from './cv-editor';

const ORIGIN = 'http://localhost:3000';
const BLOB = 'https://abc.public.blob.vercel-storage.com/cv';
const server = setupServer();

function renderEditor() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CvEditor />
    </QueryClientProvider>,
  );
}

const card = (name: string) =>
  screen.getByRole('heading', { name }).closest('article')!;

const pdf = () =>
  new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], 'cv.pdf', {
    type: 'application/pdf',
  });

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('CvEditor', () => {
  it('показывает файл из сборки, а после загрузки — новый файл', async () => {
    server.use(
      http.get(`${ORIGIN}/admin/api/v1/admin/content/cv`, () =>
        HttpResponse.json({ ru: null, en: `${BLOB}/en.pdf` }),
      ),
      http.post(`${ORIGIN}/admin/api/cv/ru`, () =>
        HttpResponse.json({ ru: `${BLOB}/ru.pdf`, en: `${BLOB}/en.pdf` }),
      ),
    );
    const user = userEvent.setup();
    renderEditor();

    await screen.findByRole('heading', { name: 'Русская версия' });
    const ru = within(card('Русская версия'));
    expect(ru.getByText(/Файл из сборки сайта/)).toBeTruthy();
    expect(ru.getByRole('link', { name: 'открыть' }).getAttribute('href')).toBe(
      '/cv/Sobol_Vladislav_CV_RU.pdf',
    );
    // У загруженного файла есть кнопка «вернуть из сборки», у файла из сборки нет
    expect(ru.queryByRole('button', { name: /Вернуть/ })).toBe(null);
    expect(
      within(card('English version')).getByRole('button', { name: /Вернуть/ }),
    ).toBeTruthy();

    await user.upload(ru.getByLabelText('Новый PDF'), pdf());
    await user.click(ru.getByRole('button', { name: 'Загрузить' }));

    expect(await ru.findByRole('status')).toBeTruthy();
    expect(ru.getByRole('link', { name: 'открыть' }).getAttribute('href')).toBe(
      `${BLOB}/ru.pdf`,
    );
  });

  it('объясняет, что хранилище не подключено', async () => {
    server.use(
      http.get(`${ORIGIN}/admin/api/v1/admin/content/cv`, () =>
        HttpResponse.json({ ru: null, en: null }),
      ),
      http.post(`${ORIGIN}/admin/api/cv/en`, () =>
        HttpResponse.json(
          { code: 'storageNotConfigured', message: 'нет' },
          { status: 503 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderEditor();
    await screen.findByRole('heading', { name: 'English version' });
    const en = within(card('English version'));

    await user.upload(en.getByLabelText('Новый PDF'), pdf());
    await user.click(en.getByRole('button', { name: 'Загрузить' }));

    expect((await en.findByRole('alert')).textContent).toMatch(
      /Хранилище Vercel Blob не подключено/,
    );
  });
});
