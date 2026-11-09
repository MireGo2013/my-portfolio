// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ContentList } from './content-list';

const API = 'http://localhost:3000/admin/api/v1/admin/content/skills';
const server = setupServer();

const category = (id: string, name: string) => ({
  id,
  slug: id,
  translations: { ru: { name }, en: { name } },
  skills: ['A'],
});

function renderList() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ContentList
        section="skills"
        title="Стек"
        description="Группы"
        describe={(item) => ({ title: item.translations.ru.name })}
      />
    </QueryClientProvider>,
  );
}

const names = () =>
  within(screen.getByRole('list'))
    .getAllByRole('link')
    .map((link) => link.textContent);

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe('ContentList', () => {
  it('«выше» отправляет новый порядок и сразу переставляет строку', async () => {
    let items = [category('a', 'Языки'), category('b', 'Фронтенд')];
    let sent: string[] | undefined;
    server.use(
      http.get(API, () => HttpResponse.json(items)),
      http.put(`${API}/order`, async ({ request }) => {
        sent = ((await request.json()) as { ids: string[] }).ids;
        items = sent.map((id) => items.find((item) => item.id === id)!);
        return HttpResponse.json(items);
      }),
    );
    const user = userEvent.setup();
    renderList();
    await screen.findByRole('link', { name: 'Фронтенд' });

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Выше: Языки' })
        .disabled,
    ).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Выше: Фронтенд' }));

    expect(names()).toEqual(['Фронтенд', 'Языки']);
    await waitFor(() => expect(sent).toEqual(['b', 'a']));
  });

  it('если порядок не сохранился, строки возвращаются на место', async () => {
    server.use(
      http.get(API, () =>
        HttpResponse.json([category('a', 'Языки'), category('b', 'Фронтенд')]),
      ),
      http.put(`${API}/order`, () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup();
    renderList();
    await screen.findByRole('link', { name: 'Фронтенд' });

    await user.click(screen.getByRole('button', { name: 'Ниже: Языки' }));

    expect(
      await screen.findByText('Не удалось сохранить порядок'),
    ).toBeTruthy();
    expect(names()).toEqual(['Языки', 'Фронтенд']);
  });

  it('удаляет только после подтверждения', async () => {
    let items = [category('a', 'Языки')];
    const deleted: string[] = [];
    server.use(
      http.get(API, () => HttpResponse.json(items)),
      http.delete(`${API}/:id`, ({ params }) => {
        deleted.push(String(params['id']));
        items = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderList();
    await screen.findByRole('link', { name: 'Языки' });

    await user.click(screen.getByRole('button', { name: 'Удалить: Языки' }));
    await user.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(deleted).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Удалить: Языки' }));
    await user.click(screen.getByRole('button', { name: 'Да, удалить' }));

    expect(await screen.findByText('Записей пока нет')).toBeTruthy();
    expect(deleted).toEqual(['a']);
  });
});
