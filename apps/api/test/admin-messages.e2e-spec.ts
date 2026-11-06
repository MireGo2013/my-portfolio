import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ADMIN_COOKIES, API_PREFIX } from '@portfolio/shared';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { hashPassword } from '../src/auth/passwords.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Нужна запущенная база. Сообщения теста помечены доменом, по нему же
// идёт поиск, чтобы чужие сообщения в базе не мешали проверкам
const MARK = 'messages-e2e';
const DOMAIN = `@${MARK}.example.com`;
const ADMIN_EMAIL = `admin${DOMAIN}`;
const PASSWORD = 'messages-e2e-password';
const URL = `${API_PREFIX}/admin/messages`;

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

const fixtures = [
  { name: 'Анна', status: 'NEW', createdAt: day('2026-10-01') },
  { name: 'Борис', status: 'READ', createdAt: day('2026-10-02') },
  { name: 'Вера', status: 'NEW', createdAt: day('2026-10-03') },
  { name: 'Глеб', status: 'SPAM', createdAt: day('2026-10-04') },
  { name: 'Дина', status: 'ARCHIVED', createdAt: day('2026-10-05') },
] as const;

describe(URL, () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cookie: string;
  const ids = new Map<string, string>();

  const get = (path = '', query: Record<string, string | number> = {}) =>
    request(app.getHttpServer())
      .get(`${URL}${path}`)
      .query(path === '' ? { q: MARK, ...query } : query)
      .set('Cookie', cookie);
  const names = (body: { items: { name: string }[] }) =>
    body.items.map((item) => item.name);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
    await prisma.adminUser.create({
      data: { email: ADMIN_EMAIL, passwordHash: await hashPassword(PASSWORD) },
    });
    const login = await request(app.getHttpServer())
      .post(`${API_PREFIX}/auth/login`)
      .send({ email: ADMIN_EMAIL, password: PASSWORD })
      .expect(204);
    const access = (login.headers['set-cookie'] as unknown as string[])
      .map((line) => line.split(';')[0] ?? '')
      .find((pair) => pair.startsWith(`${ADMIN_COOKIES.access}=`));
    cookie = access ?? '';
  });

  beforeEach(async () => {
    await prisma.contactMessage.deleteMany({
      where: { email: { endsWith: DOMAIN } },
    });
    for (const fixture of fixtures) {
      const row = await prisma.contactMessage.create({
        data: {
          ...fixture,
          email: `${fixture.name.toLowerCase()}${DOMAIN}`,
          message: `Сообщение от ${fixture.name}`,
        },
      });
      ids.set(fixture.name, row.id);
    }
  });

  afterAll(async () => {
    await prisma.contactMessage.deleteMany({
      where: { email: { endsWith: DOMAIN } },
    });
    await prisma.adminUser.deleteMany({ where: { email: ADMIN_EMAIL } });
    await app.close();
  });

  describe('список', () => {
    it('по умолчанию новые сверху, с данными для пагинации', async () => {
      const { body } = await get().expect(200);

      expect(names(body)).toEqual(['Дина', 'Глеб', 'Вера', 'Борис', 'Анна']);
      expect(body).toMatchObject({
        total: 5,
        page: 1,
        pageSize: 20,
        pageCount: 1,
      });
      expect(body.items[0]).toMatchObject({
        email: `дина${DOMAIN}`,
        status: 'ARCHIVED',
        createdAt: '2026-10-05T12:00:00.000Z',
      });
    });

    it('фильтрует по статусу', async () => {
      const { body } = await get('', { status: 'NEW' }).expect(200);

      expect(names(body)).toEqual(['Вера', 'Анна']);
      expect(body.total).toBe(2);
    });

    it('ищет по тексту без учёта регистра', async () => {
      const { body } = await get('', { q: 'ОТ БОРИС' }).expect(200);

      expect(names(body)).toEqual(['Борис']);
    });

    it('фильтрует по периоду: from включительно, to — нет', async () => {
      const { body } = await get('', {
        from: '2026-10-02T12:00:00.000Z',
        to: '2026-10-04T12:00:00.000Z',
      }).expect(200);

      expect(names(body)).toEqual(['Вера', 'Борис']);
    });

    it('сортирует по имени и делит на страницы', async () => {
      const first = await get('', {
        sort: 'name',
        order: 'asc',
        pageSize: 10,
      }).expect(200);
      expect(names(first.body)).toEqual([
        'Анна',
        'Борис',
        'Вера',
        'Глеб',
        'Дина',
      ]);

      // Страница за последней: пусто, но total честный
      const beyond = await get('', { page: 2, pageSize: 10 }).expect(200);
      expect(beyond.body).toMatchObject({ items: [], total: 5, pageCount: 1 });
    });

    it.each<Record<string, string | number>>([
      { status: 'UNKNOWN' },
      { page: 0 },
      { pageSize: 13 },
      { sort: 'message' },
      { from: '2026-10-05' },
      { from: '2026-10-05T00:00:00Z', to: '2026-10-01T00:00:00Z' },
    ])('отвечает 400 на неверный параметр %j', async (query) => {
      await get('', query).expect(400);
    });
  });

  it('считает сообщения по статусам', async () => {
    const before = (await get('/counts').expect(200)).body;
    await prisma.contactMessage.create({
      data: { name: 'Ещё', email: `ещё${DOMAIN}`, message: 'Ещё одно' },
    });

    const after = (await get('/counts').expect(200)).body;

    expect(after.NEW).toBe(before.NEW + 1);
    expect(after.total).toBe(before.total + 1);
    expect(
      after.NEW + after.READ + after.REPLIED + after.ARCHIVED + after.SPAM,
    ).toBe(after.total);
  });

  describe('одно сообщение', () => {
    it('отдаёт сообщение по id', async () => {
      const { body } = await get(`/${ids.get('Анна')}`).expect(200);

      expect(body).toMatchObject({ name: 'Анна', status: 'NEW' });
    });

    it('меняет статус и время изменения', async () => {
      const id = ids.get('Анна');
      const { body } = await request(app.getHttpServer())
        .patch(`${URL}/${id}`)
        .set('Cookie', cookie)
        .send({ status: 'REPLIED' })
        .expect(200);

      expect(body.status).toBe('REPLIED');
      expect(new Date(body.updatedAt) > new Date(body.createdAt)).toBe(true);
      const row = await prisma.contactMessage.findUnique({ where: { id } });
      expect(row?.status).toBe('REPLIED');
    });

    it('отвечает 404 на несуществующий id и 400 на кривой', async () => {
      const missing = '01900000-0000-7000-8000-000000000000';
      await get(`/${missing}`).expect(404);
      await request(app.getHttpServer())
        .patch(`${URL}/${missing}`)
        .set('Cookie', cookie)
        .send({ status: 'READ' })
        .expect(404);
      await get('/not-a-uuid').expect(400);
    });

    it('отвечает 400 на неизвестный статус', async () => {
      await request(app.getHttpServer())
        .patch(`${URL}/${ids.get('Анна')}`)
        .set('Cookie', cookie)
        .send({ status: 'DELETED' })
        .expect(400);
    });
  });

  describe('доступ', () => {
    it('без сессии отвечает 401', async () => {
      await request(app.getHttpServer()).get(URL).expect(401);
      await request(app.getHttpServer()).get(`${URL}/counts`).expect(401);
    });

    it('смену статуса с чужого сайта отклоняет', async () => {
      await request(app.getHttpServer())
        .patch(`${URL}/${ids.get('Анна')}`)
        .set('Cookie', cookie)
        .set('Origin', 'https://evil.example.com')
        .send({ status: 'SPAM' })
        .expect(403);
    });
  });
});
