import { writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { API_PREFIX } from '@portfolio/shared';
import { AppModule } from './app.module.js';
import { createOpenApiDocument } from './app.setup.js';

/**
 * Пишет контракт API в openapi.json. Режим preview строит граф модулей, не
 * создавая провайдеры, поэтому база и DATABASE_URL здесь не нужны.
 */
const app = await NestFactory.create(AppModule, {
  preview: true,
  logger: false,
});
app.setGlobalPrefix(API_PREFIX);

const document = createOpenApiDocument(app);
writeFileSync('openapi.json', `${JSON.stringify(document, null, 2)}\n`);

await app.close();
