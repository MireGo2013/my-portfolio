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
import { base32Decode, hotp, totpStep } from '../src/auth/totp.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createAdminSession } from './admin-session.js';

// Нужна запущенная база. Весь путь: подключить второй фактор, войти с кодом,
// не войти повторным кодом, войти резервным, выключить
const EMAIL = 'admin@totp-e2e.example.com';
const PASSWORD = 'admin-session-e2e-password';
const AUTH = `${API_PREFIX}/auth`;
const TOTP = `${API_PREFIX}/admin/security/totp`;
const PROXY_SECRET = 'totp-e2e-proxy-secret';

/** Код приложения для шага относительно текущего. */
const codeFor = (secret: string, shift = 0) =>
  hotp(base32Decode(secret), totpStep() + shift);

function cookiesFrom(res: Response): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of (res.headers['set-cookie'] as unknown as string[]) ?? []) {
    const [pair = ''] = line.split(';');
    const [name = '', value = ''] = pair.split('=');
    result[name] = value;
  }
  return result;
}

describe('второй фактор', () => {
  let app: INestApplication<App>;
  let cookie: string;
  let cleanup: () => Promise<void>;
  let secret = '';
  let backupCodes: string[] = [];

  const http = () => request(app.getHttpServer());
  // У каждого теста свой IP посетителя, как его передаёт сайт: иначе все
  // попытки входа файла попали бы в один лимит
  let clientIp = '';
  const asVisitor = (req: request.Test) =>
    req.set('x-proxy-secret', PROXY_SECRET).set('x-client-ip', clientIp);
  const login = () =>
    asVisitor(http().post(`${AUTH}/login`)).send({
      email: EMAIL,
      password: PASSWORD,
    });
  const loginTotp = (mfa: string, code: string) =>
    asVisitor(http().post(`${AUTH}/login/totp`))
      .set('Cookie', `${ADMIN_COOKIES.mfa}=${mfa}`)
      .send({ code });

  let ipCounter = 0;
  beforeEach(() => {
    vi.stubEnv('PROXY_SECRET', PROXY_SECRET);
    ipCounter += 1;
    clientIp = `198.51.100.${ipCounter}`;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    ({ cookie, cleanup } = await createAdminSession(app, EMAIL));
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('без второго фактора вход по паролю сразу даёт сессию', async () => {
    const res = await login().expect(204);

    expect(cookiesFrom(res)[ADMIN_COOKIES.access]).toBeTruthy();
    const { body } = await http().get(TOTP).set('Cookie', cookie).expect(200);
    expect(body).toEqual({ enabled: false, backupCodesLeft: 0 });
  });

  it('подключение: секрет, подтверждение кодом, резервные коды', async () => {
    const setup = await http()
      .post(`${TOTP}/setup`)
      .set('Cookie', cookie)
      .expect(200);
    secret = setup.body.secret;
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(setup.body.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);

    // В базе секрет зашифрован
    const stored = await app
      .get(PrismaService)
      .adminUser.findUnique({ where: { email: EMAIL } });
    expect(stored?.totpPendingSecret).not.toContain(secret);

    await http()
      .post(`${TOTP}/enable`)
      .set('Cookie', cookie)
      .send({ code: '000000' })
      .expect(400);

    const enabled = await http()
      .post(`${TOTP}/enable`)
      .set('Cookie', cookie)
      .send({ code: codeFor(secret) })
      .expect(200);
    backupCodes = enabled.body.backupCodes;
    expect(backupCodes).toHaveLength(10);
    expect(backupCodes[0]).toMatch(/^[A-Z2-7]{4}-[A-Z2-7]{4}-[A-Z2-7]{2}$/);

    // Сессия, в которой включали, жива
    await http().get(TOTP).set('Cookie', cookie).expect(200);
  });

  it('с включённым фактором пароль даёт только шаг с кодом', async () => {
    const res = await login().expect(200);

    expect(res.body).toEqual({ mfaRequired: true });
    const cookies = cookiesFrom(res);
    expect(cookies[ADMIN_COOKIES.access]).toBeUndefined();
    const mfa = cookies[ADMIN_COOKIES.mfa] ?? '';
    expect(mfa).toBeTruthy();

    await loginTotp(mfa, '000000').expect(401);
    // Код текущего шага уже потрачен на включение: берём следующий
    const ok = await loginTotp(mfa, codeFor(secret, 1)).expect(204);
    expect(cookiesFrom(ok)[ADMIN_COOKIES.access]).toBeTruthy();

    // Тот же код второй раз не проходит
    await loginTotp(mfa, codeFor(secret, 1)).expect(401);
  });

  it('токен доступа не годится вместо токена шага с кодом', async () => {
    const access = cookie.split('=')[1] ?? '';

    await loginTotp(access, codeFor(secret, 1)).expect(401);
  });

  it('резервный код срабатывает один раз, в любом регистре', async () => {
    const mfa = cookiesFrom(await login().expect(200))[ADMIN_COOKIES.mfa] ?? '';
    const backup = backupCodes[0] ?? '';

    await loginTotp(mfa, backup.toLowerCase().replaceAll('-', ' ')).expect(204);
    await loginTotp(mfa, backup).expect(401);

    const { body } = await http().get(TOTP).set('Cookie', cookie).expect(200);
    expect(body).toEqual({ enabled: true, backupCodesLeft: 9 });
  });

  it('перебор кода упирается в лимит попыток', async () => {
    const mfa = cookiesFrom(await login().expect(200))[ADMIN_COOKIES.mfa] ?? '';
    for (let i = 0; i < 5; i += 1) {
      await loginTotp(mfa, '000000').expect(401);
    }

    await loginTotp(mfa, codeFor(secret, 1)).expect(429);
  });

  it('шаг с кодом одноразовый: после входа та же cookie не работает', async () => {
    const mfa = cookiesFrom(await login().expect(200))[ADMIN_COOKIES.mfa] ?? '';
    await loginTotp(mfa, backupCodes[2] ?? '').expect(204);

    const reuse = await loginTotp(mfa, backupCodes[3] ?? '').expect(401);
    expect(reuse.body.code).toBe('mfaExpired');
  });

  it('попытки считаются на шаг, а не на IP: смена адреса не помогает', async () => {
    const mfa = cookiesFrom(await login().expect(200))[ADMIN_COOKIES.mfa] ?? '';
    for (let i = 0; i < 5; i += 1) {
      clientIp = `203.0.113.${i + 1}`;
      const wrong = await loginTotp(mfa, '000000').expect(401);
      expect(wrong.body.code).toBe('codeInvalid');
    }

    clientIp = '203.0.113.99';
    const exhausted = await loginTotp(mfa, backupCodes[3] ?? '').expect(401);
    expect(exhausted.body.code).toBe('mfaExpired');
  });

  it('если секрет не расшифровывается, резервный код всё равно впускает', async () => {
    // Так выглядит база после смены JWT_SECRET
    const prisma = app.get(PrismaService);
    const user = await prisma.adminUser.findUniqueOrThrow({
      where: { email: EMAIL },
    });
    await prisma.adminUser.update({
      where: { email: EMAIL },
      data: { totpSecret: 'v1:AAAA:BBBB:CCCC' },
    });

    try {
      const mfa =
        cookiesFrom(await login().expect(200))[ADMIN_COOKIES.mfa] ?? '';
      // Код из приложения проверить нечем — но это 401, а не 500
      await loginTotp(mfa, codeFor(secret, 1)).expect(401);
      await loginTotp(mfa, backupCodes[4] ?? '').expect(204);
    } finally {
      await prisma.adminUser.update({
        where: { email: EMAIL },
        data: { totpSecret: user.totpSecret },
      });
    }
  });

  it('выключение требует кода', async () => {
    await http()
      .post(`${TOTP}/disable`)
      .set('Cookie', cookie)
      .send({ code: '000000' })
      .expect(400);

    await http()
      .post(`${TOTP}/disable`)
      .set('Cookie', cookie)
      .send({ code: backupCodes[1] })
      .expect(204);

    await login().expect(204);
  });
});
