import { describe, expect, it } from 'vitest';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { ExperienceService } from './experience.service.js';

function createService(items: unknown[]): ExperienceService {
  const prisma = {
    experience: { findMany: () => Promise.resolve(items) },
  } as unknown as PrismaService;
  return new ExperienceService(prisma);
}

describe('ExperienceService', () => {
  it('отдаёт даты в формате YYYY-MM', async () => {
    const service = createService([
      {
        slug: 'a',
        startDate: new Date('2021-12-01'),
        endDate: new Date('2026-07-01'),
        translations: [{ project: 'Проект' }],
      },
    ]);

    await expect(service.list('ru')).resolves.toMatchObject([
      {
        slug: 'a',
        project: 'Проект',
        startDate: '2021-12',
        endDate: '2026-07',
      },
    ]);
  });

  it('оставляет null у незавершённой работы', async () => {
    const service = createService([
      {
        slug: 'a',
        startDate: new Date('2026-01-01'),
        endDate: null,
        translations: [{ project: 'Проект' }],
      },
    ]);

    const [item] = await service.list('ru');

    expect(item?.endDate).toBeNull();
  });
});
