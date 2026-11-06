import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { seedContent } from '../src/database/seed-content.js';
import {
  experience,
  projects,
  skillCategories,
} from '../src/database/seed-data.js';

// Нужна запущенная база. Тест меняет контент, а в конце возвращает базу
// к данным seed, как её и ждут остальные тесты
describe('seedContent', () => {
  let prisma: PrismaClient;

  const counts = async () => ({
    experience: await prisma.experience.count(),
    projects: await prisma.project.count(),
    skills: await prisma.skillCategory.count(),
    profile: await prisma.profile.count(),
  });
  const seeded = {
    experience: experience.length,
    projects: projects.length,
    skills: skillCategories.length,
    profile: 1,
  };

  beforeAll(() => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: process.env['DATABASE_URL'] ?? '',
      }),
    });
  });

  afterAll(async () => {
    await seedContent(prisma, { reset: true });
    await prisma.$disconnect();
  });

  it('не трогает контент, который правили в админке', async () => {
    await prisma.profile.update({
      where: { id: 1 },
      data: { title: 'Правка из админки' },
    });
    const [firstSkill] = await prisma.skillCategory.findMany({
      orderBy: { position: 'asc' },
      take: 1,
    });
    await prisma.skillCategory.delete({ where: { id: firstSkill!.id } });

    // Так запускает seed каждая выкладка
    expect(await seedContent(prisma)).toBe('skipped');

    const profile = await prisma.profile.findUnique({ where: { id: 1 } });
    expect(profile?.title).toBe('Правка из админки');
    // Удалённая группа не вернулась
    expect(await prisma.skillCategory.count()).toBe(skillCategories.length - 1);
  });

  it('заполняет пустую базу', async () => {
    await prisma.experience.deleteMany();
    await prisma.project.deleteMany();
    await prisma.skillCategory.deleteMany();
    await prisma.profile.deleteMany();

    expect(await seedContent(prisma)).toBe('filled');

    expect(await counts()).toEqual(seeded);
  });

  it('два одновременных запуска на пустой базе заполняют её один раз', async () => {
    await prisma.profile.deleteMany();
    await prisma.experience.deleteMany();

    const results = await Promise.all([
      seedContent(prisma),
      seedContent(prisma),
    ]);

    expect(results.sort()).toEqual(['filled', 'skipped']);
    expect(await counts()).toEqual(seeded);
  });

  it('с reset перезаписывает правки данными seed', async () => {
    await prisma.profile.update({
      where: { id: 1 },
      data: { title: 'Правка из админки' },
    });

    expect(await seedContent(prisma, { reset: true })).toBe('filled');

    const profile = await prisma.profile.findUnique({ where: { id: 1 } });
    expect(profile?.title).not.toBe('Правка из админки');
    expect(await counts()).toEqual(seeded);
  });
});
