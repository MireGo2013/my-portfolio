import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { API_PREFIX } from '@portfolio/shared';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';

describe(`GET ${API_PREFIX}/health (нужна запущенная база)`, () => {
  let app: INestApplication<App>;

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

  it('отвечает 200 и подтверждает связь с PostgreSQL', async () => {
    const response = await request(app.getHttpServer())
      .get(`${API_PREFIX}/health`)
      .expect(200);

    expect(response.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('без глобального префикса маршрут не отвечает', async () => {
    await request(app.getHttpServer()).get('/health').expect(404);
  });
});
