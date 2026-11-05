import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { API_PREFIX } from '@portfolio/shared';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { CONTACT_RATE_LIMIT } from '../src/contact/contact.module.js';
import { TelegramService } from '../src/contact/telegram.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// Нужна запущенная база. Записи теста помечены доменом и удаляются после него
const EMAIL_DOMAIN = '@contact-e2e.example.com';
const URL = `${API_PREFIX}/contact`;

const valid = {
  name: 'Анна',
  email: `anna${EMAIL_DOMAIN}`,
  message: 'Здравствуйте! Хотим обсудить вакансию.',
};

describe(`POST ${URL}`, () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const notifyContactMessage = vi.fn();

  const post = (body: object) =>
    request(app.getHttpServer()).post(URL).send(body);
  const savedMessages = () =>
    prisma.contactMessage.findMany({
      where: { email: { endsWith: EMAIL_DOMAIN } },
    });

  beforeEach(async () => {
    notifyContactMessage.mockReset();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TelegramService)
      .useValue({ notifyContactMessage })
      .compile();

    // Новое приложение на каждый тест: счётчик throttler живёт в его памяти
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.contactMessage.deleteMany({
      where: { email: { endsWith: EMAIL_DOMAIN } },
    });
    await app.close();
  });

  it('сохраняет очищенное сообщение и отправляет уведомление', async () => {
    await post({ ...valid, name: '  Анна  ' }).expect(204);

    expect(await savedMessages()).toMatchObject([
      { name: 'Анна', email: valid.email, message: valid.message },
    ]);
    expect(notifyContactMessage).toHaveBeenCalledWith({
      name: 'Анна',
      email: valid.email,
      message: valid.message,
    });
  });

  it('отвечает 400 с ошибками по полям и ничего не сохраняет', async () => {
    const { body } = await post({
      name: 'А',
      email: `не-почта${EMAIL_DOMAIN}`,
      message: 'коротко',
    }).expect(400);

    expect(Object.keys(body.errors).sort()).toEqual([
      'email',
      'message',
      'name',
    ]);
    expect(await savedMessages()).toEqual([]);
    expect(notifyContactMessage).not.toHaveBeenCalled();
  });

  it('заполненный honeypot выглядит как успех, но ничего не делает', async () => {
    await post({ ...valid, website: 'https://spam.example.com' }).expect(204);

    expect(await savedMessages()).toEqual([]);
    expect(notifyContactMessage).not.toHaveBeenCalled();
  });

  it('отвечает 429 сверх лимита и не сохраняет лишнее', async () => {
    for (let i = 0; i < CONTACT_RATE_LIMIT; i += 1) {
      await post(valid).expect(204);
    }

    await post(valid).expect(429);

    expect(await savedMessages()).toHaveLength(CONTACT_RATE_LIMIT);
  });

  it('CORS разрешает запросы только с адреса сайта', async () => {
    const preflight = (origin: string) =>
      request(app.getHttpServer())
        .options(URL)
        .set('Origin', origin)
        .set('Access-Control-Request-Method', 'POST');

    const allowed = await preflight('http://localhost:3000');
    const denied = await preflight('https://evil.example.com');

    expect(allowed.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    expect(denied.headers['access-control-allow-origin']).not.toBe(
      'https://evil.example.com',
    );
  });
});
