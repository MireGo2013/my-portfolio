import type { INestApplication } from '@nestjs/common';
import { API_PREFIX } from '@portfolio/shared';

/** Общая настройка приложения: её вызывают и main.ts, и e2e-тесты. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
}
