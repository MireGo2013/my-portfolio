import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ADMIN_COOKIES, API_PREFIX } from '@portfolio/shared';
import request, { type Response } from 'supertest';
import type { App } from 'supertest/types.js';
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
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PROXY_HEADERS } from '../src/common/client-ip-throttler.guard.js';
import {
  LOGIN_RATE_LIMIT,
  REFRESH_GRACE_MS,
} from '../src/auth/auth.constants.js';
import { hashPassword } from '../src/auth/passwords.js';
import { hashToken } from '../src/auth/tokens.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Нужна запущенная база и JWT_SECRET. Пользователь теста удаляется после него,
// а его сессии уходят каскадом
const EMAIL = 'admin@auth-e2e.example.com';
const PASSWORD = 'correct horse battery staple';
const AUTH = `${API_PREFIX}/auth`;
const SITE_ORIGIN = 'http://localhost:3000';

type Cookies = Partial<Record<'access' | 'refresh', string>>;

/** Значения cookie сессии из ответа. Пустое значение значит, что cookie стёрли. */
function readAuthCookies(res: Response): Cookies {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  const result: Cookies = {};
  for (const line of header ?? []) {
    const [pair = ''] = line.split(';');
    const [name, value = ''] = pair.split('=');
    if (name === ADMIN_COOKIES.access) result.access = value;
    if (name === ADMIN_COOKIES.refresh) result.refresh = value;
  }
  return result;
}

function cookieHeader(cookies: Cookies): string {
  return [
    cookies.access && `${ADMIN_COOKIES.access}=${cookies.access}`,
    cookies.refresh && `${ADMIN_COOKIES.refresh}=${cookies.refresh}`,
  ]
    .filter(Boolean)
    .join('; ');
}

describe(AUTH, () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let userId: string;

  const http = () => request(app.getHttpServer());
  const login = (body: object = { email: EMAIL, password: PASSWORD }) =>
    http().post(`${AUTH}/login`).send(body);
  const me = (cookies: Cookies) =>
    http().get(`${AUTH}/me`).set('Cookie', cookieHeader(cookies));
  const loginOk = async () => readAuthCookies(await login().expect(204));
  const sessions = () => prisma.adminSession.findMany({ where: { userId } });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const setupApp = moduleRef.createNestApplication();
    await setupApp.init();
    const db = setupApp.get(PrismaService);
    await db.adminUser.deleteMany({ where: { email: EMAIL } });
    const user = await db.adminUser.create({
      data: { email: EMAIL, passwordHash: await hashPassword(PASSWORD) },
    });
    userId = user.id;
    await setupApp.close();
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    // Новое приложение на каждый тест: счётчик throttler живёт в его памяти
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.adminSession.deleteMany({ where: { userId } });
    await app.close();
  });

  afterAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const cleanupApp = moduleRef.createNestApplication();
    await cleanupApp.init();
    await cleanupApp
      .get(PrismaService)
      .adminUser.deleteMany({ where: { email: EMAIL } });
    await cleanupApp.close();
  });

  describe('вход', () => {
    it('ставит httpOnly-cookie и хранит в базе только хеш токена', async () => {
      const res = await login({
        email: `  ${EMAIL.toUpperCase()} `,
        password: PASSWORD,
      }).expect(204);

      const setCookie = res.headers['set-cookie'] as unknown as string[];
      expect(setCookie).toHaveLength(2);
      for (const line of setCookie) {
        expect(line).toMatch(/HttpOnly/);
        expect(line).toMatch(/Secure/);
        expect(line).toMatch(/SameSite=Lax/);
        expect(line).toMatch(/Path=\//);
      }

      const { refresh } = readAuthCookies(res);
      const [session] = await sessions();
      expect(session?.tokenHash).toBe(hashToken(refresh ?? ''));
      expect(session?.tokenHash).not.toBe(refresh);
    });

    it('одинаково отвечает 401 на неверный пароль и чужую почту', async () => {
      const wrongPassword = await login({
        email: EMAIL,
        password: 'nope',
      }).expect(401);
      const unknownEmail = await login({
        email: 'ghost@auth-e2e.example.com',
        password: PASSWORD,
      }).expect(401);

      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
      expect(readAuthCookies(wrongPassword)).toEqual({});
      expect(await sessions()).toEqual([]);
    });

    it('отвечает 400 на тело не по схеме', async () => {
      const { body } = await login({ email: 'не-почта', password: '' }).expect(
        400,
      );

      expect(Object.keys(body.errors).sort()).toEqual(['email', 'password']);
    });

    it(`после ${LOGIN_RATE_LIMIT} попыток отвечает 429 даже на верный пароль`, async () => {
      for (let i = 0; i < LOGIN_RATE_LIMIT; i += 1) {
        await login({ email: EMAIL, password: 'nope' }).expect(401);
      }

      await login().expect(429);
    });

    describe('посетитель за сервером сайта', () => {
      const SECRET = 'proxy-secret-for-e2e';
      const loginFrom = (ip: string, secret = SECRET) =>
        login({ email: EMAIL, password: 'nope' })
          .set(PROXY_HEADERS.secret, secret)
          .set(PROXY_HEADERS.clientIp, ip);
      const exhaustLimit = async (ip: string, secret?: string) => {
        for (let i = 0; i < LOGIN_RATE_LIMIT; i += 1) {
          await loginFrom(ip, secret).expect(401);
        }
      };

      beforeEach(() => {
        vi.stubEnv('PROXY_SECRET', SECRET);
      });
      afterEach(() => {
        vi.unstubAllEnvs();
      });

      it('с верным секретом лимит считается для каждого посетителя отдельно', async () => {
        await exhaustLimit('203.0.113.1');

        await loginFrom('203.0.113.1').expect(429);
        // Злоумышленник исчерпал свой лимит, а автор с другого адреса входит
        await login()
          .set(PROXY_HEADERS.secret, SECRET)
          .set(PROXY_HEADERS.clientIp, '203.0.113.2')
          .expect(204);
      });

      it('с неверным секретом присланный IP игнорируется', async () => {
        await exhaustLimit('203.0.113.1', 'guess');

        await loginFrom('203.0.113.2', 'guess').expect(429);
      });
    });
  });

  describe('проверка сессии', () => {
    it('/me отдаёт пользователя по cookie доступа', async () => {
      const cookies = await loginOk();

      const { body } = await me(cookies).expect(200);

      expect(body).toEqual({ id: userId, email: EMAIL, role: 'ADMIN' });
    });

    it('без cookie или с поддельным токеном отвечает 401', async () => {
      await me({}).expect(401);
      await me({ access: 'not-a-jwt' }).expect(401);
    });

    it('истёкшая сессия не пускает даже с живым токеном доступа', async () => {
      const cookies = await loginOk();
      await prisma.adminSession.updateMany({
        where: { userId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      await me(cookies).expect(401);
    });
  });

  describe('обновление токенов', () => {
    it('выдаёт новую пару, а старый токен обновления перестаёт работать', async () => {
      const first = await loginOk();

      const res = await http()
        .post(`${AUTH}/refresh`)
        .set('Cookie', cookieHeader({ refresh: first.refresh }))
        .expect(204);
      const second = readAuthCookies(res);

      expect(second.refresh).toBeTruthy();
      expect(second.refresh).not.toBe(first.refresh);
      await me(second).expect(200);

      // Окно для параллельных запросов прошло — старый токен мёртв
      await prisma.adminSession.updateMany({
        where: { userId },
        data: { rotatedAt: new Date(Date.now() - REFRESH_GRACE_MS - 1000) },
      });
      const reuse = await http()
        .post(`${AUTH}/refresh`)
        .set('Cookie', cookieHeader({ refresh: first.refresh }))
        .expect(401);
      // Cookie не стираются: у браузера может уже лежать новый токен
      expect(readAuthCookies(reuse)).toEqual({});
      // А новый токен по-прежнему работает
      await http()
        .post(`${AUTH}/refresh`)
        .set('Cookie', cookieHeader({ refresh: second.refresh }))
        .expect(204);
    });

    it('параллельные обновления одним токеном не завершают сессию', async () => {
      const first = await loginOk();
      const refresh = () =>
        http()
          .post(`${AUTH}/refresh`)
          .set('Cookie', cookieHeader({ refresh: first.refresh }));

      // Так ведёт себя вкладка, вернувшаяся через полчаса: три запроса разом
      const responses = await Promise.all([refresh(), refresh(), refresh()]);

      expect(responses.map((res) => res.status)).toEqual([204, 204, 204]);
      const cookies = responses.map(readAuthCookies);
      // Новый токен обновления выдал ровно один ответ, никто не стёр cookie
      expect(cookies.filter((c) => c.refresh).length).toBe(1);
      for (const c of cookies) {
        expect(c.access).toBeTruthy();
        await me(c).expect(200);
      }
      expect(await sessions()).toHaveLength(1);
    });
  });

  describe('выход', () => {
    it('удаляет сессию: тот же токен доступа сразу перестаёт работать', async () => {
      const cookies = await loginOk();

      const res = await http()
        .post(`${AUTH}/logout`)
        .set('Cookie', cookieHeader(cookies))
        .expect(204);

      expect(readAuthCookies(res)).toEqual({ access: '', refresh: '' });
      expect(await sessions()).toEqual([]);
      await me(cookies).expect(401);
    });
  });

  describe('защита от CSRF', () => {
    it('отклоняет вход и выход с чужого сайта', async () => {
      await login().set('Origin', 'https://evil.example.com').expect(403);
      await http()
        .post(`${AUTH}/logout`)
        .set('Origin', 'https://evil.example.com')
        .expect(403);
    });

    it('пропускает запрос с адреса сайта', async () => {
      await login().set('Origin', SITE_ORIGIN).expect(204);
    });
  });
});
