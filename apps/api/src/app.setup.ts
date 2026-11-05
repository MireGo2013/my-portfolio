import type { INestApplication } from '@nestjs/common';
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
  // UI: /api/docs, JSON: /api/docs-json
  SwaggerModule.setup('api/docs', app, createOpenApiDocument(app));
}
