import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { work, projects, skillCategories } from './seed-data.js';
import { seedContent } from './seed-content.js';

// Запуск: node dist/database/seed.js [--reset]
// Без флага заполняет только пустую базу — так его вызывает db:release
// при каждой выкладке. С --reset стирает контент и заполняет заново.

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('Не задан DATABASE_URL');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const reset = process.argv.includes('--reset');
// В прод-образе NODE_ENV=production. Там --reset стёр бы все правки из админки
// без резервной копии, поэтому без явного разрешения он не работает
if (
  reset &&
  process.env['NODE_ENV'] === 'production' &&
  process.env['ALLOW_SEED_RESET'] !== 'true'
) {
  console.error(
    'Seed --reset в production стёр бы контент из админки. Если это и нужно, задайте ALLOW_SEED_RESET=true',
  );
  process.exit(1);
}

try {
  const result = await seedContent(prisma, { reset });
  console.log(
    result === 'skipped'
      ? 'Seed пропущен: контент уже есть, его правят в админке. Перезаписать: --reset'
      : `Seed готов: опыт ${work.length}, проекты ${projects.length}, категории навыков ${skillCategories.length}`,
  );
} finally {
  await prisma.$disconnect();
}
