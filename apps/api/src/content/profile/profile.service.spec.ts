import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { ProfileService } from './profile.service.js';

function createService(profile: unknown): ProfileService {
  const prisma = {
    profile: { findUnique: () => Promise.resolve(profile) },
  } as unknown as PrismaService;
  return new ProfileService(prisma);
}

describe('ProfileService', () => {
  it('объединяет общие данные и перевод', async () => {
    const service = createService({
      email: 'a@example.com',
      translations: [{ fullName: 'Vladislav Sobol', summary: 'About' }],
    });

    await expect(service.get('en')).resolves.toEqual({
      email: 'a@example.com',
      fullName: 'Vladislav Sobol',
      summary: 'About',
    });
  });

  it('падает, если нет перевода на этот язык', async () => {
    const service = createService({ email: 'a@example.com', translations: [] });

    await expect(service.get('en')).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('отвечает 404, если база ещё не заполнена', async () => {
    await expect(createService(null).get('ru')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
