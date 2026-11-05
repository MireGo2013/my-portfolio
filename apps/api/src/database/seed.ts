import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { LOCALES, type Locale } from '@portfolio/shared';
import { PrismaClient } from '../generated/prisma/client.js';
import { experience, profile, projects, skillCategories } from './seed-data.js';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('Не задан DATABASE_URL');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** Тип требует тексты на всех языках: пропущенный перевод не пройдёт компиляцию. */
function toRows<T extends object>(
  translations: Record<Locale, T>,
): (T & { locale: Locale })[] {
  return LOCALES.map((locale) => ({ ...translations[locale], locale }));
}

/**
 * Полностью заменяет публичный контент данными из seed-data.ts.
 * Таблицу contact_messages не трогает: там сообщения реальных людей.
 */
async function main(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.experience.deleteMany();
    await tx.project.deleteMany();
    await tx.skillCategory.deleteMany(); // навыки и переводы удалятся каскадом

    const { translations: profileTranslations, ...profileData } = profile;
    await tx.profile.upsert({
      where: { id: 1 },
      create: { id: 1, ...profileData },
      update: profileData,
    });
    await tx.profileTranslation.deleteMany({ where: { profileId: 1 } });
    await tx.profileTranslation.createMany({
      data: toRows(profileTranslations).map((row) => ({
        ...row,
        profileId: 1,
      })),
    });

    for (const [position, item] of experience.entries()) {
      await tx.experience.create({
        data: {
          slug: item.slug,
          role: item.role,
          startDate: new Date(item.startDate),
          endDate: new Date(item.endDate),
          stack: item.stack,
          position,
          translations: { create: toRows(item.translations) },
        },
      });
    }

    for (const [position, item] of projects.entries()) {
      await tx.project.create({
        data: {
          slug: item.slug,
          kind: item.kind,
          stack: item.stack,
          repoUrl: item.repoUrl,
          liveUrl: item.liveUrl,
          position,
          translations: { create: toRows(item.translations) },
        },
      });
    }

    for (const [position, category] of skillCategories.entries()) {
      await tx.skillCategory.create({
        data: {
          slug: category.slug,
          position,
          translations: { create: toRows(category.translations) },
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
