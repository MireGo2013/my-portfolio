import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_PREFIX } from '@portfolio/shared';

/** Общая настройка приложения: её вызывают и main.ts, и e2e-тесты. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);

  const config = new DocumentBuilder()
    .setTitle('Portfolio API')
    .setDescription('REST API сайта-портфолио Владислава Соболя')
    .setVersion('1.0')
    .build();
  // UI: /api/docs, JSON для генерации типов на фронте: /api/docs-json
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
}
