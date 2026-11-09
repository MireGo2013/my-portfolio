import { execSync } from 'node:child_process';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedContent } from '../src/database/seed-content.js';
import { work, projects, skillCategories } from '../src/database/seed-data.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

// Тест стирает и заполняет контент целиком, поэтому работает в своей схеме
// PostgreSQL, а не в общей: контент, который правили в локальной админке,
// он не трогает и от него не зависит. Схема создаётся миграциями заново
// и удаляется после теста
const SCHEMA = 'seed_e2e';

function schemaUrl(base: string, schema: string): string {
  const url = new URL(base);
  url.searchParams.set('schema', schema);
  return url.toString();
}

describe('seedContent', () => {
  const baseUrl = process.env['DATABASE_URL'] ?? '';
  let admin: PrismaClient;
  let prisma: PrismaClient;

  const counts = async () => ({
    work: await prisma.work.count(),
    projects: await prisma.project.count(),
    skills: await prisma.skillCategory.count(),
    profile: await prisma.profile.count(),
  });
  const seeded = {
    work: work.length,
    projects: projects.length,
    skills: skillCategories.length,
    profile: 1,
  };
  const empty = { work: 0, projects: 0, skills: 0, profile: 0 };

  beforeAll(() => {
    admin = new PrismaClient({
      adapter: new PrismaPg({ connectionString: baseUrl }),
    });
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: baseUrl }, { schema: SCHEMA }),
    });
  });

  beforeAll(async () => {
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    // Те же миграции, что и в проде, только в отдельную схему
    execSync('pnpm exec prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: schemaUrl(baseUrl, SCHEMA) },
      stdio: 'pipe',
    });
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await admin.$disconnect();
  });

  it('заполняет пустую базу', async () => {
    expect(await counts()).toEqual(empty);

    expect(await seedContent(prisma)).toBe('filled');

    expect(await counts()).toEqual(seeded);
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

  it('с reset перезаписывает правки данными seed', async () => {
    expect(await seedContent(prisma, { reset: true })).toBe('filled');

    const profile = await prisma.profile.findUnique({ where: { id: 1 } });
    expect(profile?.title).not.toBe('Правка из админки');
    expect(await counts()).toEqual(seeded);
  });

  it('два одновременных запуска на пустой базе заполняют её один раз', async () => {
    await prisma.work.deleteMany();
    await prisma.project.deleteMany();
    await prisma.skillCategory.deleteMany();
    await prisma.profile.deleteMany();

    const results = await Promise.all([
      seedContent(prisma),
      seedContent(prisma),
    ]);

    expect(results.sort()).toEqual(['filled', 'skipped']);
    expect(await counts()).toEqual(seeded);
  });
});
