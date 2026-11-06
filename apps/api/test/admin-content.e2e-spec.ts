import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { API_PREFIX } from '@portfolio/shared';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { createAdminSession } from './admin-session.js';

// Нужна база с seed. Тест меняет настоящий контент, поэтому всё, что создал,
// удаляет, а профиль и порядок возвращает как было
const ADMIN = `${API_PREFIX}/admin/content`;
const MARK = 'content-e2e';

const experienceInput = (slug: string) => ({
  slug,
  role: 'Тестовая роль',
  startDate: '2024-01',
  endDate: null,
  stack: ['React', '  ', 'NestJS'],
  translations: {
    ru: {
      company: '',
      project: 'Проект e2e',
      summary: 'Описание',
      responsibilities: ['Делал', ''],
      achievements: [],
    },
    en: {
      company: 'Company',
      project: 'Project e2e',
      summary: 'Summary',
      responsibilities: ['Did'],
      achievements: ['Shipped'],
    },
  },
});

const projectInput = (slug: string) => ({
  slug,
  kind: 'OPEN_SOURCE',
  stack: ['TypeScript'],
  repoUrl: 'https://github.com/example/e2e',
  liveUrl: '',
  translations: {
    ru: { name: 'Проект e2e', description: 'Описание' },
    en: { name: 'Project e2e', description: 'Description' },
  },
});

describe(ADMIN, () => {
  let app: INestApplication<App>;
  let cookie: string;
  let cleanupAdmin: () => Promise<void>;

  const http = () => request(app.getHttpServer());
  const admin = (method: 'get' | 'post' | 'put' | 'delete', path: string) =>
    http()[method](`${ADMIN}${path}`).set('Cookie', cookie);
  const publicList = async (path: string, locale = 'ru') =>
    (await http().get(`${API_PREFIX}${path}?locale=${locale}`).expect(200))
      .body as { slug: string }[];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    ({ cookie, cleanup: cleanupAdmin } = await createAdminSession(
      app,
      `admin@${MARK}.example.com`,
    ));
  });

  afterAll(async () => {
    await cleanupAdmin();
    await app.close();
  });

  it('без сессии не пускает', async () => {
    await http().get(`${ADMIN}/profile`).expect(401);
    await http().put(`${ADMIN}/experience/order`).send({ ids: [] }).expect(401);
  });

  describe('профиль', () => {
    it('отдаёт оба языка и сохраняет изменения на сайте', async () => {
      const { body: original } = await admin('get', '/profile').expect(200);
      expect(original.translations.ru.shortName).toBe('Влад');
      expect(original.translations.en.shortName).toBe('Vlad');

      try {
        const { body: saved } = await admin('put', '/profile')
          .send({ ...original, title: 'E2E Engineer' })
          .expect(200);
        expect(saved.title).toBe('E2E Engineer');

        const { body: site } = await http()
          .get(`${API_PREFIX}/profile?locale=en`)
          .expect(200);
        expect(site.title).toBe('E2E Engineer');
      } finally {
        await admin('put', '/profile').send(original).expect(200);
      }
    });

    it('отклоняет неверные поля с кодами ошибок', async () => {
      const { body: original } = await admin('get', '/profile').expect(200);

      const { body } = await admin('put', '/profile')
        .send({
          ...original,
          email: 'не-почта',
          githubUrl: 'javascript:alert(1)',
          translations: {
            ...original.translations,
            ru: { ...original.translations.ru, about: ['', ' '] },
          },
        })
        .expect(400);

      // Вложенные поля — полным путём, как их называет форма
      expect(body.errors).toEqual({
        email: ['emailInvalid'],
        githubUrl: ['urlInvalid'],
        'translations.ru.about': ['required'],
      });
    });
  });

  describe('коммерческие проекты', () => {
    it('создание, правка, порядок и удаление', async () => {
      const before = await publicList('/experience');

      // Создание: в конец списка, пустые пункты выброшены, пустая компания — null
      const { body: created } = await admin('post', '/experience')
        .send(experienceInput(`${MARK}-exp`))
        .expect(201);
      expect(created).toMatchObject({
        stack: ['React', 'NestJS'],
        translations: {
          ru: { company: null, responsibilities: ['Делал'] },
        },
      });
      const afterCreate = await publicList('/experience', 'en');
      expect(afterCreate.at(-1)?.slug).toBe(`${MARK}-exp`);

      try {
        // Тот же slug второй раз — 409 с полем для формы
        const conflict = await admin('post', '/experience')
          .send(experienceInput(`${MARK}-exp`))
          .expect(409);
        expect(conflict.body.errors).toEqual({ slug: ['slugTaken'] });

        // Конец раньше начала — 400
        await admin('put', `/experience/${created.id}`)
          .send({ ...experienceInput(`${MARK}-exp`), endDate: '2023-12' })
          .expect(400);

        const { body: updated } = await admin(
          'put',
          `/experience/${created.id}`,
        )
          .send({
            ...experienceInput(`${MARK}-exp`),
            role: 'Новая роль',
            endDate: '2025-06',
          })
          .expect(200);
        expect(updated).toMatchObject({
          role: 'Новая роль',
          endDate: '2025-06',
        });

        // Порядок: новую запись в начало, затем вернуть как было
        const { body: list } = await admin('get', '/experience').expect(200);
        const ids: string[] = list.map((item: { id: string }) => item.id);
        const moved = [created.id, ...ids.filter((id) => id !== created.id)];
        await admin('put', '/experience/order')
          .send({ ids: moved })
          .expect(200);
        expect((await publicList('/experience'))[0]?.slug).toBe(`${MARK}-exp`);

        // Неполный список id отклоняется
        await admin('put', '/experience/order')
          .send({ ids: moved.slice(1) })
          .expect(400);

        await admin('put', '/experience/order').send({ ids }).expect(200);
      } finally {
        await admin('delete', `/experience/${created.id}`).expect(204);
      }

      await admin('get', `/experience/${created.id}`).expect(404);
      await admin('delete', `/experience/${created.id}`).expect(404);
      expect(await publicList('/experience')).toEqual(before);
    });
  });

  describe('открытые проекты', () => {
    it('создание, правка и удаление', async () => {
      const { body: created } = await admin('post', '/projects')
        .send(projectInput(`${MARK}-proj`))
        .expect(201);
      expect(created).toMatchObject({ liveUrl: null, kind: 'OPEN_SOURCE' });

      try {
        const { body: updated } = await admin('put', `/projects/${created.id}`)
          .send({
            ...projectInput(`${MARK}-proj`),
            kind: 'FREELANCE',
            liveUrl: 'https://example.com',
          })
          .expect(200);
        expect(updated).toMatchObject({
          kind: 'FREELANCE',
          liveUrl: 'https://example.com',
        });
        const site = await publicList('/projects', 'en');
        expect(site.at(-1)).toMatchObject({
          slug: `${MARK}-proj`,
          name: 'Project e2e',
        });
      } finally {
        await admin('delete', `/projects/${created.id}`).expect(204);
      }
    });
  });

  describe('стек', () => {
    it('группа с навыками: порядок навыков — порядок в списке', async () => {
      const input = {
        slug: `${MARK}-skills`,
        translations: { ru: { name: 'Тест' }, en: { name: 'Test' } },
        skills: ['Vitest', 'Playwright'],
      };
      const { body: created } = await admin('post', '/skills')
        .send(input)
        .expect(201);

      try {
        await admin('put', `/skills/${created.id}`)
          .send({ ...input, skills: ['Playwright', 'Vitest', 'MSW'] })
          .expect(200);
        const site = (
          await http().get(`${API_PREFIX}/skills?locale=en`).expect(200)
        ).body as { slug: string; name: string; skills: string[] }[];
        expect(site.at(-1)).toEqual({
          slug: `${MARK}-skills`,
          name: 'Test',
          skills: ['Playwright', 'Vitest', 'MSW'],
        });

        // Повтор навыка — почти всегда опечатка
        const { body } = await admin('put', `/skills/${created.id}`)
          .send({ ...input, skills: ['MSW', 'msw'] })
          .expect(400);
        expect(body.errors.skills).toEqual(['duplicate']);
      } finally {
        await admin('delete', `/skills/${created.id}`).expect(204);
      }
    });
  });
});
