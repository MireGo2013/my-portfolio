import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { experience, projects, skillCategories } from './seed-data.js';
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

try {
  const reset = process.argv.includes('--reset');
  const result = await seedContent(prisma, { reset });
  console.log(
    result === 'skipped'
      ? 'Seed пропущен: контент уже есть, его правят в админке. Перезаписать: --reset'
      : `Seed готов: опыт ${experience.length}, проекты ${projects.length}, категории навыков ${skillCategories.length}`,
  );
} finally {
  await prisma.$disconnect();
}
