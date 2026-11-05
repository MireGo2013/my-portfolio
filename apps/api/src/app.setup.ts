import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';
import { API_PREFIX } from '@portfolio/shared';

/** Описание API. Вызывать после app.setGlobalPrefix, иначе пути будут без префикса. */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Portfolio API')
    .setDescription('REST API сайта-портфолио Владислава Соболя')
    .setVersion('1.0')
    .build();
  return SwaggerModule.createDocument(app, config);
}

/** Общая настройка приложения: её вызывают и main.ts, и e2e-тесты. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  // Из браузера к API обращается только форма контактов
  app.enableCors({
    origin: app
      .get(ConfigService)
      .get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    methods: ['POST'],
  });
  // UI: /api/docs, JSON: /api/docs-json
  SwaggerModule.setup('api/docs', app, createOpenApiDocument(app));
}
