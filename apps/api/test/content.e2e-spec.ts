import { readFileSync } from 'node:fs';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { API_PREFIX } from '@portfolio/shared';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

// Нужна запущенная база с применёнными миграциями и seed: pnpm db:seed
describe('API контента', () => {
  let app: INestApplication<App>;

  const get = (path: string) => request(app.getHttpServer()).get(path);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /profile отдаёт контакты и не раскрывает служебный id', async () => {
    const { body } = await get(`${API_PREFIX}/profile`).expect(200);

    expect(body).toMatchObject({
      fullName: 'Владислав Соболь',
      email: 'sobol.work.v92@gmail.com',
      linkedinUrl: 'https://www.linkedin.com/in/vlad-sobol-59458b214/',
    });
    expect(body).not.toHaveProperty('id');
  });

  it('GET /experience отдаёт опыт в заданном порядке, с датами YYYY-MM', async () => {
    const { body } = await get(`${API_PREFIX}/experience`).expect(200);

    expect(body[0]).toMatchObject({
      slug: 'vtb',
      startDate: '2021-12',
      endDate: '2026-07',
    });
    expect(body[0].highlights.length).toBeGreaterThan(0);
    expect(body[0]).not.toHaveProperty('id');
    expect(body[0]).not.toHaveProperty('position');
    expect(body.map((item: { slug: string }) => item.slug)).toEqual([
      'vtb',
      'scooter-admin-crm',
      'law-portal',
      'kitchen-space',
      'vezetvsem',
    ]);
  });

  it('GET /projects отдаёт открытые и фриланс-проекты со ссылками', async () => {
    const { body } = await get(`${API_PREFIX}/projects`).expect(200);

    expect(body[0]).toMatchObject({
      slug: 'offline-dv-photo-studio',
      kind: 'OPEN_SOURCE',
      repoUrl: 'https://github.com/mirego2013/offline-dv-photo-studio',
    });
    expect(
      body.find((item: { slug: string }) => item.slug === 'beauty-vitebsk'),
    ).toMatchObject({ kind: 'FREELANCE', repoUrl: null });
  });

  it('GET /skills отдаёт навыки по областям, как массив строк', async () => {
    const { body } = await get(`${API_PREFIX}/skills`).expect(200);

    expect(body[0]).toEqual({
      slug: 'languages',
      name: 'Языки',
      skills: ['TypeScript', 'JavaScript (ES2023)'],
    });
  });

  describe('язык контента', () => {
    it('GET /profile отдаёт тексты на нужном языке, по умолчанию русский', async () => {
      const byDefault = await get(`${API_PREFIX}/profile`).expect(200);
      const russian = await get(`${API_PREFIX}/profile?locale=ru`).expect(200);
      const english = await get(`${API_PREFIX}/profile?locale=en`).expect(200);

      expect(byDefault.body.fullName).toBe('Владислав Соболь');
      expect(russian.body.fullName).toBe('Владислав Соболь');
      expect(english.body.fullName).toBe('Vladislav Sobol');
      expect(english.body).not.toHaveProperty('translations');
    });

    it('общие данные одинаковы на обоих языках, а тексты различаются', async () => {
      const { body: ru } = await get(`${API_PREFIX}/experience`).expect(200);
      const { body: en } = await get(
        `${API_PREFIX}/experience?locale=en`,
      ).expect(200);

      expect(en[0]).toMatchObject({
        slug: ru[0].slug,
        startDate: ru[0].startDate,
        stack: ru[0].stack,
        company: 'VTB Bank',
      });
      expect(ru[0].company).toBe('ПАО «Банк ВТБ»');
    });

    it('у всего контента есть английский перевод', async () => {
      const projects = await get(`${API_PREFIX}/projects?locale=en`).expect(
        200,
      );
      const skills = await get(`${API_PREFIX}/skills?locale=en`).expect(200);

      expect(projects.body).toHaveLength(10);
      expect(skills.body[0].name).toBe('Languages');
    });

    it('неизвестный язык отклоняется с кодом 400', async () => {
      await get(`${API_PREFIX}/profile?locale=de`).expect(400);
    });
  });

  it('OpenAPI-документ описывает все эндпоинты и nullable-поля', async () => {
    const { body } = await get('/api/docs-json').expect(200);

    expect(Object.keys(body.paths).sort()).toEqual(
      ['contact', 'experience', 'health', 'profile', 'projects', 'skills'].map(
        (path) => `${API_PREFIX}/${path}`,
      ),
    );
    expect(
      body.components.schemas.ExperienceDto.properties.endDate,
    ).toMatchObject({ nullable: true });
    expect(body.components.schemas.ProjectKind.enum).toEqual([
      'OPEN_SOURCE',
      'FREELANCE',
    ]);
  });

  it('openapi.json в репозитории совпадает с текущим кодом', async () => {
    const { body } = await get('/api/docs-json').expect(200);
    const committed: unknown = JSON.parse(readFileSync('openapi.json', 'utf8'));

    // Упал? Контракт изменился: выполни pnpm gen:api и закоммить результат
    expect(body).toEqual(committed);
  });

  it('Swagger UI открывается', async () => {
    await get('/api/docs').expect(200).expect('Content-Type', /html/);
  });
});
