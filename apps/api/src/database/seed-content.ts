import { LOCALES, type Locale } from '@portfolio/shared';
import type { PrismaClient } from '../generated/prisma/client.js';
import { work, profile, projects, skillCategories } from './seed-data.js';

/** Тип требует тексты на всех языках: пропущенный перевод не пройдёт компиляцию. */
function toRows<T extends object>(
  translations: Record<Locale, T>,
): (T & { locale: Locale })[] {
  return LOCALES.map((locale) => ({ ...translations[locale], locale }));
}

export type SeedResult = 'filled' | 'skipped';

/**
 * Заполняет публичный контент из seed-data.ts.
 *
 * По умолчанию — только пустую базу. Контент правят в админке, а seed
 * запускается при каждой выкладке (db:release): перезапись стёрла бы правки.
 * «Пустая» значит «нет профиля»: он один, его создаёт только seed, а удалить
 * его из админки нельзя. Проверять каждый раздел нельзя: автор мог нарочно
 * удалить все навыки, и seed вернул бы их при следующей выкладке.
 *
 * reset: true — стереть и заполнить заново. Только для локальной разработки.
 * Таблицы сообщений и пользователей не трогает никогда.
 */
export async function seedContent(
  prisma: PrismaClient,
  { reset = false }: { reset?: boolean } = {},
): Promise<SeedResult> {
  return prisma.$transaction(
    async (tx) => {
      // Блокировка на время транзакции: два одновременных запуска seed
      // (например, два экземпляра при выкладке) не заполнят базу дважды
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('portfolio-seed'))`;

      if (!reset && (await tx.profile.count()) > 0) {
        return 'skipped';
      }

      await tx.work.deleteMany();
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

      for (const [position, item] of work.entries()) {
        await tx.work.create({
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

      return 'filled';
    },
    // По умолчанию у транзакции 5 секунд. На удалённой базе при выкладке
    // десятки последовательных запросов могут в них не уложиться
    { timeout: 60_000 },
  );
}
