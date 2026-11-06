// Браузерные тесты двумя запусками: сначала сайт, затем тесты, которые меняют
// общий публичный контент. В конфиге второй проект зависит от первого, чтобы
// голый `playwright test` не запустил их одновременно. Но с зависимостью
// одно падение в первом молча отменило бы весь второй. Здесь второй запуск
// идёт всегда (--no-deps), а итог — неуспех, если упал любой.
//
// Аргументы передаются в оба запуска: pnpm test:e2e e2e/admin-cv.spec.ts
import { spawnSync } from 'node:child_process';

const extra = process.argv.slice(2);
const run = (args) =>
  spawnSync('pnpm', ['exec', 'playwright', 'test', ...args, ...extra], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }).status ?? 1;

// --pass-with-no-tests: фильтр по файлу может не задеть один из проектов
const site = run(['--project=chromium', '--pass-with-no-tests']);
const content = run([
  '--project=content-mutating',
  '--no-deps',
  '--pass-with-no-tests',
]);

process.exit(site || content);
