import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { experience, profile, projects, skillCategories } from './seed-data.js';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('Не задан DATABASE_URL');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/**
 * Полностью заменяет публичный контент данными из seed-data.ts.
 * Таблицу contact_messages не трогает: там сообщения реальных людей.
 */
async function main(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.experience.deleteMany();
    await tx.project.deleteMany();
    await tx.skillCategory.deleteMany(); // навыки удалятся каскадом

    await tx.profile.upsert({
      where: { id: 1 },
      create: { id: 1, ...profile },
      update: profile,
    });

    await tx.experience.createMany({
      data: experience.map((item, position) => ({
        ...item,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        position,
      })),
    });

    await tx.project.createMany({
      data: projects.map((item, position) => ({
        ...item,
        stack: [...item.stack],
        position,
      })),
    });

    for (const [position, category] of skillCategories.entries()) {
      await tx.skillCategory.create({
        data: {
          slug: category.slug,
          name: category.name,
          position,
          skills: {
            create: category.skills.map((name, skillPosition) => ({
              name,
              position: skillPosition,
            })),
          },
        },
      });
    }
  });

  console.log(
    `Seed готов: опыт ${experience.length}, проекты ${projects.length}, категории навыков ${skillCategories.length}`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
