import { NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ProfileService } from './profile.service.js';

function createService(profile: unknown): ProfileService {
  const prisma = {
    profile: { findUnique: () => Promise.resolve(profile) },
  } as unknown as PrismaService;
  return new ProfileService(prisma);
}

describe('ProfileService', () => {
  it('возвращает профиль из базы', async () => {
    const profile = { fullName: 'Владислав Соболь' };

    await expect(createService(profile).get()).resolves.toBe(profile);
  });

  it('отвечает 404, если база ещё не заполнена', async () => {
    await expect(createService(null).get()).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
