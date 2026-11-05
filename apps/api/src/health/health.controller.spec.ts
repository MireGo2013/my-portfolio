import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

function createController(queryRaw: () => Promise<unknown>): HealthController {
  const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
  return new HealthController(prisma);
}

describe('HealthController', () => {
  it('сообщает об исправной базе, когда запрос прошёл', async () => {
    const controller = createController(() => Promise.resolve([1]));

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
    });
  });

  it('отвечает 503, когда запрос к базе упал', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const controller = createController(() =>
      Promise.reject(new Error('connection refused')),
    );

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
